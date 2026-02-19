import React, { useState, useEffect } from 'react';
import { Send, User, Trash2, Calendar, FileText } from 'lucide-react';
import { notesApi } from '../../lib/supabase';
import { useAuth } from '../../contexts/useAuth';
import './EvolutionNotesPanel.css';

export default function EvolutionNotesPanel({ planId }) {
    const { user } = useAuth();
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (planId) {
            loadNotes();
        }
    }, [planId]);

    const loadNotes = async () => {
        setLoading(true);
        try {
            const data = await notesApi.getEvolutionNotes(planId);
            setNotes(data);
        } catch (err) {
            console.error('Error loading notes:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        setSubmitting(true);
        try {
            const doctorName = user?.name || 'Admin';

            const noteData = {
                treatment_plan_id: planId,
                content: newNote.trim(),
                doctor_name: doctorName,
                // doctor_id is omitted — auth user IDs are not valid doctor UUIDs
            };

            await notesApi.createEvolutionNote(noteData);
            setNewNote('');
            await loadNotes();
        } catch (err) {
            console.error('Error creating note:', err);
            alert('Error al guardar la nota');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (noteId) => {
        if (!confirm('¿Estás seguro de eliminar esta nota?')) return;
        try {
            await notesApi.deleteEvolutionNote(noteId);
            setNotes(prev => prev.filter(n => n.id !== noteId));
        } catch (err) {
            console.error('Error deleting note:', err);
        }
    };

    // Format date helper
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('es-PE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <div className="notes-panel">
            {/* Header */}
            <div className="notes-header">
                <div className="notes-header-left">
                    <h3 className="notes-title">
                        <div className="notes-icon">
                            <Calendar size={18} />
                        </div>
                        Bitácora de Evolución
                    </h3>
                    <p className="notes-subtitle">Historial cronológico</p>
                </div>
                <span className="notes-badge">
                    {notes.length}
                </span>
            </div>

            {/* Notes List */}
            <div className="notes-list custom-scrollbar">
                {loading ? (
                    <div className="loading-notes">
                        <div className="loading-spinner"></div>
                        <span style={{ fontSize: '0.875rem' }}>Cargando notas...</span>
                    </div>
                ) : notes.length === 0 ? (
                    <div className="empty-notes">
                        <div className="empty-icon">
                            <FileText size={24} />
                        </div>
                        <p style={{ fontSize: '0.875rem' }}>No hay notas registradas</p>
                    </div>
                ) : (
                    notes.map(note => (
                        <div key={note.id} className="note-item">
                            {/* Timeline line */}
                            <div className="timeline-line"></div>
                            {/* Timeline dot */}
                            <div className="timeline-dot"></div>

                            <div className="note-card">
                                <div className="note-header">
                                    <div className="doctor-info">
                                        <div className="doctor-avatar">
                                            {(note.doctor_name || 'A').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="doctor-meta">
                                            <h4>
                                                {note.doctor_name || 'Admin'}
                                            </h4>
                                            <span>
                                                {formatDate(note.created_at)}
                                            </span>
                                        </div>
                                    </div>

                                    {(user?.role === 'ADMIN' || user?.id === note.doctor_id) && (
                                        <button
                                            onClick={() => handleDelete(note.id)}
                                            className="delete-btn"
                                            title="Eliminar nota"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>

                                <div className="note-content">
                                    {note.content}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input Area */}
            <div className="notes-input-area">
                <form onSubmit={handleSubmit}>
                    <div className="input-wrapper">
                        <textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Escribe una nueva nota de evolución..."
                            className="notes-textarea custom-scrollbar"
                            rows={2}
                            disabled={submitting}
                        />
                        <button
                            type="submit"
                            disabled={!newNote.trim() || submitting}
                            className="send-button"
                            title="Enviar nota"
                        >
                            <Send size={16} />
                        </button>
                    </div>

                    <div className="input-footer">
                        <div className="signature-badge">
                            <User size={10} />
                            <span>Firmando como:</span>
                            <span className="signature-name">{user?.name || 'Sistema'}</span>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
