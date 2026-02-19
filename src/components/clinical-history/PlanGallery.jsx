import React, { useState, useEffect } from 'react';
import { Upload, Trash2, X, Camera, Edit3, Check } from 'lucide-react';
import { filesApi } from '../../lib/supabase';

const CATEGORIES = [
    { id: 'INTRAORAL', label: 'Intraorales' },
    { id: 'EXTRAORAL', label: 'Extraorales' },
];

const PlanGallery = ({ planId, patientId }) => {
    const [intraorales, setIntraorales] = useState([]);
    const [extraorales, setExtraorales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(null); // which category is uploading
    const [viewingFile, setViewingFile] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');

    useEffect(() => {
        if (planId && patientId) loadAllFiles();
    }, [planId, patientId]);

    const loadAllFiles = async () => {
        try {
            setLoading(true);
            const [intra, extra] = await Promise.all([
                filesApi.getFiles(patientId, 'INTRAORAL', planId),
                filesApi.getFiles(patientId, 'EXTRAORAL', planId),
            ]);
            setIntraorales(intra);
            setExtraorales(extra);
        } catch (error) {
            console.error('Error loading plan files:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e, category) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 50 * 1024 * 1024) return;

        try {
            setUploading(category);
            const newFile = await filesApi.uploadFile(patientId, file, category, planId, file.name);
            if (category === 'INTRAORAL') {
                setIntraorales(prev => [newFile, ...prev]);
            } else {
                setExtraorales(prev => [newFile, ...prev]);
            }
        } catch (error) {
            console.error('Error uploading:', error);
        } finally {
            setUploading(null);
            e.target.value = '';
        }
    };

    const handleDelete = async (file, category) => {
        if (!window.confirm('¿Eliminar esta imagen permanentemente?')) return;
        try {
            await filesApi.deleteFile(file.id, file.url);
            const setter = category === 'INTRAORAL' ? setIntraorales : setExtraorales;
            setter(prev => prev.filter(f => f.id !== file.id));
            if (viewingFile?.id === file.id) setViewingFile(null);
        } catch (error) {
            console.error('Error deleting:', error);
        }
    };

    const handleRename = async (file, category) => {
        if (!editValue.trim()) { setEditingId(null); return; }
        try {
            await filesApi.renameFile(file.id, editValue.trim());
            const setter = category === 'INTRAORAL' ? setIntraorales : setExtraorales;
            setter(prev => prev.map(f => f.id === file.id ? { ...f, display_name: editValue.trim() } : f));
            setEditingId(null);
            setEditValue('');
        } catch (error) {
            console.error('Error renaming:', error);
        }
    };

    const renderGallerySection = (files, category, label) => {
        const hasFiles = files.length > 0;
        const isUploading = uploading === category;

        return (
            <div style={{ marginBottom: '20px' }}>
                {/* Section header with title and upload button */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                }}>
                    <h6 style={{
                        margin: 0,
                        fontSize: '13px',
                        fontWeight: '700',
                        color: '#334155',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                    }}>
                        {hasFiles ? `Imágenes ${label}` : `${label}`}
                        {hasFiles && (
                            <span style={{
                                marginLeft: '8px',
                                fontSize: '11px',
                                fontWeight: '600',
                                color: '#94a3b8',
                            }}>
                                ({files.length})
                            </span>
                        )}
                    </h6>
                    <label style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: '1.5px solid #e2e8f0',
                        background: 'white',
                        color: '#475569',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        opacity: isUploading ? 0.6 : 1,
                    }}>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUpload(e, category)}
                            style={{ display: 'none' }}
                            disabled={isUploading}
                        />
                        <Upload size={13} />
                        {isUploading ? 'Subiendo...' : 'Subir'}
                    </label>
                </div>

                {/* Grid: 4 per row */}
                {hasFiles ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '10px',
                    }}>
                        {files.map(file => (
                            <div key={file.id} style={{
                                borderRadius: '8px',
                                overflow: 'hidden',
                                border: '1px solid #e2e8f0',
                                background: 'white',
                                transition: 'box-shadow 0.15s',
                            }}
                                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'}
                                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                            >
                                {/* Image */}
                                <div
                                    style={{ position: 'relative', cursor: 'pointer' }}
                                    onClick={() => setViewingFile(file)}
                                >
                                    <img
                                        src={file.url}
                                        alt={file.display_name || file.name}
                                        style={{
                                            width: '100%',
                                            aspectRatio: '4/3',
                                            objectFit: 'cover',
                                            display: 'block',
                                        }}
                                        loading="lazy"
                                    />
                                    {/* Delete button overlay */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(file, category); }}
                                        style={{
                                            position: 'absolute',
                                            top: '6px',
                                            right: '6px',
                                            background: 'rgba(239, 68, 68, 0.9)',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '24px',
                                            height: '24px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            color: 'white',
                                            opacity: 0,
                                            transition: 'opacity 0.15s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                        onMouseLeave={e => e.currentTarget.style.opacity = 0}
                                        className="delete-btn-hover"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>

                                {/* Name + date */}
                                <div style={{ padding: '6px 8px' }}>
                                    {editingId === file.id ? (
                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                            <input
                                                value={editValue}
                                                onChange={e => setEditValue(e.target.value)}
                                                style={{
                                                    flex: 1,
                                                    fontSize: '11px',
                                                    padding: '3px 6px',
                                                    border: '1px solid #cbd5e1',
                                                    borderRadius: '4px',
                                                    outline: 'none',
                                                }}
                                                autoFocus
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') handleRename(file, category);
                                                    if (e.key === 'Escape') setEditingId(null);
                                                }}
                                            />
                                            <button
                                                onClick={() => handleRename(file, category)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#10b981' }}
                                            >
                                                <Check size={13} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{
                                                    margin: 0,
                                                    fontSize: '11px',
                                                    fontWeight: '600',
                                                    color: '#334155',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {file.display_name || file.name}
                                                </p>
                                                <p style={{
                                                    margin: '1px 0 0',
                                                    fontSize: '10px',
                                                    color: '#94a3b8',
                                                }}>
                                                    {new Date(file.uploaded_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => { setEditingId(file.id); setEditValue(file.display_name || file.name); }}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: '2px',
                                                    color: '#94a3b8',
                                                    flexShrink: 0,
                                                }}
                                                title="Renombrar"
                                            >
                                                <Edit3 size={12} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{
                        padding: '20px',
                        textAlign: 'center',
                        color: '#94a3b8',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px dashed #e2e8f0',
                        fontSize: '12px',
                    }}>
                        <Camera size={18} style={{ marginBottom: '4px', opacity: 0.4 }} />
                        <p style={{ margin: 0 }}>Sin imágenes {label.toLowerCase()}</p>
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Cargando imágenes...</div>;
    }

    return (
        <div>
            {renderGallerySection(intraorales, 'INTRAORAL', 'Intraorales')}
            {renderGallerySection(extraorales, 'EXTRAORAL', 'Extraorales')}

            {/* Lightbox */}
            {viewingFile && (
                <div
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(15, 23, 42, 0.95)', zIndex: 9999,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(8px)',
                    }}
                    onClick={() => setViewingFile(null)}
                >
                    <button
                        style={{
                            position: 'absolute', top: '24px', right: '24px',
                            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '50%', width: '48px', height: '48px',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white',
                        }}
                        onClick={() => setViewingFile(null)}
                    >
                        <X size={28} />
                    </button>
                    <div style={{ maxWidth: '95vw', maxHeight: '95vh', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <img
                            src={viewingFile.url}
                            alt={viewingFile.display_name || viewingFile.name}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '85vh',
                                borderRadius: '8px',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                            }}
                        />
                        <div style={{ marginTop: '16px', color: '#94a3b8', fontSize: '14px' }}>
                            <strong style={{ color: 'white', display: 'block', marginBottom: '4px', fontSize: '16px' }}>
                                {viewingFile.display_name || viewingFile.name}
                            </strong>
                            {new Date(viewingFile.uploaded_at).toLocaleString()}
                        </div>
                    </div>
                </div>
            )}

            {/* CSS for hover effect on delete button */}
            <style>{`
                .delete-btn-hover { opacity: 0 !important; }
                div:hover > div > .delete-btn-hover,
                div:hover > .delete-btn-hover { opacity: 1 !important; }
            `}</style>
        </div>
    );
};

export default PlanGallery;
