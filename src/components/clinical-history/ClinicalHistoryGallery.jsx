import React, { useState, useEffect } from 'react';
import { Camera, Upload, Trash2, X, Image as ImageIcon, Box, MonitorPlay } from 'lucide-react';
import { filesApi } from '../../lib/supabase';
import styles from './ClinicalHistory.module.css';
import STLViewer from './STLViewer'; // Import 3D Viewer

const ClinicalHistoryGallery = ({ patientId }) => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [viewingFile, setViewingFile] = useState(null);
    const [activeTab, setActiveTab] = useState('RADIOGRAFIA');
    const [customName, setCustomName] = useState('');

    useEffect(() => {
        if (patientId) loadFiles();
    }, [patientId, activeTab]);

    const loadFiles = async () => {
        try {
            setLoading(true);
            const data = await filesApi.getFiles(patientId, activeTab);
            setFiles(data);
        } catch (error) {
            console.error('Error loading files:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate size (max 50MB for STLs, images usually smaller but let's allow 50MB globally)
        if (file.size > 50 * 1024 * 1024) {
            alert('El archivo es demasiado grande (Máx 50MB)');
            return;
        }

        try {
            setUploading(true);
            const displayName = customName.trim() || file.name;
            const newFile = await filesApi.uploadFile(patientId, file, activeTab, null, displayName);
            setFiles(prev => [newFile, ...prev]);
            setCustomName('');
        } catch (error) {
            console.error('Error uploading:', error);
            alert('Error al subir archivo: ' + error.message);
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const handleDelete = async (file) => {
        if (!window.confirm('¿Eliminar este archivo permanentemente?')) return;
        try {
            await filesApi.deleteFile(file.id, file.url);
            setFiles(prev => prev.filter(f => f.id !== file.id));
            if (viewingFile?.id === file.id) setViewingFile(null);
        } catch (error) {
            alert('Error al eliminar: ' + error.message);
        }
    };

    const isSTL = (filename) => filename?.toLowerCase().endsWith('.stl');
    const isPDF = (contentType) => contentType?.includes('pdf');

    return (
        <div className={styles.content}>
            {/* Tabs for Image Type */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <button
                    onClick={() => setActiveTab('RADIOGRAFIA')}
                    className={`${styles.tab} ${activeTab === 'RADIOGRAFIA' ? styles.active : ''}`}
                    style={{ background: activeTab === 'RADIOGRAFIA' ? '#f0fdfa' : 'white', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', cursor: 'pointer' }}
                >
                    <ImageIcon size={18} color={activeTab === 'RADIOGRAFIA' ? '#0f766e' : '#64748b'} />
                    <span style={{ color: activeTab === 'RADIOGRAFIA' ? '#0f766e' : '#64748b', fontWeight: 500 }}>Radiografías</span>
                </button>
                <button
                    onClick={() => setActiveTab('SCAN_3D')}
                    className={`${styles.tab} ${activeTab === 'SCAN_3D' ? styles.active : ''}`}
                    style={{ background: activeTab === 'SCAN_3D' ? '#f0fdfa' : 'white', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', cursor: 'pointer' }}
                >
                    <Box size={18} color={activeTab === 'SCAN_3D' ? '#0f766e' : '#64748b'} />
                    <span style={{ color: activeTab === 'SCAN_3D' ? '#0f766e' : '#64748b', fontWeight: 500 }}>Escaneos 3D</span>
                </button>
            </div>

            {/* Upload Area */}
            <label className={styles.uploadArea} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px', border: '2px dashed #cbd5e1', borderRadius: '12px', cursor: 'pointer', background: '#f8fafc', transition: 'all 0.2s' }}>
                <input
                    type="file"
                    accept="image/*,.pdf,.stl"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    disabled={uploading}
                />
                <div style={{ width: '48px', height: '48px', background: '#e0f2fe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', marginBottom: '12px' }}>
                    <Upload size={24} />
                </div>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, fontWeight: 600, color: '#0f172a' }}>
                        {uploading ? 'Subiendo archivo...' : 'Haz clic o arrastra para subir archivo'}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                        PNG, JPG, PDF, STL hasta 50MB
                    </p>
                </div>
            </label>

            {/* Custom name input */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '12px', marginBottom: '16px' }}>
                <input
                    type="text"
                    placeholder="Nombre personalizado (opcional)"
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    style={{
                        flex: 1,
                        padding: '10px 14px',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '13px',
                        outline: 'none',
                    }}
                />
            </div>

            {/* Gallery Grid */}
            {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ display: 'inline-block', width: '24px', height: '24px', borderRadius: '50%', border: '2px solid #cbd5e1', borderTopColor: '#0f766e', animation: 'spin 1s linear infinite', marginBottom: '10px' }}></div>
                    <p>Cargando galería...</p>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
            ) : files.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px', marginTop: '20px', border: '1px solid #e2e8f0' }}>
                    No hay archivos en esta categoría.
                </div>
            ) : (
                <div className={styles.galleryGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px', marginTop: '20px' }}>
                    {files.map(file => (
                        <div key={file.id} className={styles.galleryItem} onClick={() => setViewingFile(file)} style={{ aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', position: 'relative', cursor: 'pointer', background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                            {/* Render Thumbnail based on Type */}
                            {isSTL(file.name) ? (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdfa', color: '#0f766e', flexDirection: 'column', gap: '8px' }}>
                                    <Box size={40} />
                                    <span style={{ fontSize: '11px', fontWeight: 600, background: 'rgba(255,255,255,0.6)', padding: '2px 6px', borderRadius: '4px' }}>MODELO 3D</span>
                                </div>
                            ) : isPDF(file.content_type) ? (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff1f2', color: '#ef4444', flexDirection: 'column', gap: '8px' }}>
                                    <MonitorPlay size={40} />
                                    <span style={{ fontSize: '11px', fontWeight: 600 }}>DOCUMENTO PDF</span>
                                </div>
                            ) : (
                                <img src={file.url} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                            )}

                            {/* Overlay Info */}
                            <div className={styles.itemOverlay} style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                                padding: '8px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                                opacity: 0, transition: 'opacity 0.2s'
                            }}
                                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                onMouseLeave={e => e.currentTarget.style.opacity = 0}
                            >
                                <span style={{ fontSize: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%' }}>
                                    {file.display_name || file.name} · {new Date(file.uploaded_at).toLocaleDateString()}
                                </span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(file); }}
                                    style={{ background: '#ef4444', border: 'none', color: 'white', borderRadius: '4px', padding: '4px', cursor: 'pointer', display: 'flex' }}
                                    title="Eliminar archivo"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox / Modal View */}
            {viewingFile && (
                <div
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(15, 23, 42, 0.95)', zIndex: 9999,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(8px)'
                    }}
                    onClick={() => setViewingFile(null)}
                >
                    <button
                        style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '48px', height: '48px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', transition: 'background 0.2s' }}
                        onClick={() => setViewingFile(null)}
                    >
                        <X size={28} />
                    </button>

                    <div style={{ maxWidth: '95vw', maxHeight: '95vh', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={e => e.stopPropagation()}>

                        {/* Conditionally Render Viewer */}
                        {isSTL(viewingFile.name) ? (
                            <div style={{
                                width: '85vw', height: '80vh',
                                background: '#1e293b', borderRadius: '16px',
                                overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                                border: '1px solid #334155'
                            }}>
                                <STLViewer url={viewingFile.url} />
                            </div>
                        ) : isPDF(viewingFile.content_type) ? (
                            <iframe src={viewingFile.url} style={{ width: '80vw', height: '80vh', border: 'none', background: 'white', borderRadius: '8px' }} title="PDF Viewer" />
                        ) : (
                            <img
                                src={viewingFile.url}
                                alt="Full view"
                                style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
                            />
                        )}

                        <div style={{ marginTop: '16px', color: '#94a3b8', fontSize: '14px', textAlign: 'center' }}>
                            <strong style={{ color: 'white', display: 'block', marginBottom: '4px', fontSize: '16px' }}>{viewingFile.display_name || viewingFile.name}</strong>
                            {new Date(viewingFile.uploaded_at).toLocaleString()} · {Math.round(viewingFile.size_bytes / 1024)} KB
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClinicalHistoryGallery;
