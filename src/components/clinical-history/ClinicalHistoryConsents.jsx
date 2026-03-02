import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, PenTool, FileText, Printer, CheckCircle } from 'lucide-react';
import { patientConsentsApi } from '../../lib/supabase';
import SignatureCanvas from 'react-signature-canvas';
import PrintableBudget from '../common/PrintableBudget'; // Re-use print styles if possible, but actually we'll do raw print

export default function ClinicalHistoryConsents({ patientId, patientName }) {
    const [consents, setConsents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Printable
    const [printingConsent, setPrintingConsent] = useState(null);

    // Form
    const [formData, setFormData] = useState({
        treatment_name: '',
        content: '',
    });
    const sigCanvas = useRef(null);
    const [signatureData, setSignatureData] = useState(null);

    // Templates
    const templates = [
        {
            name: 'Extracción Dental Simple',
            content: `Yo, ${patientName}, por la presente doy mi consentimiento para la extracción dental de... \n\nHe sido informado(a) de los riesgos potenciales, alternativas y expectativas post-operatorias.`
        },
        {
            name: 'Cirugía de Terceras Molares',
            content: `Yo, ${patientName}, consiento la extracción quirúrgica de mis terceras molares. Entiendo los riesgos de inflamación, infección, parestesia temporal o permanente, y sangrado.`
        },
        {
            name: 'Tratamiento de Endodoncia',
            content: `Yo, ${patientName}, habiendo sido debidamente informado(a) sobre mi diagnóstico, acepto realizarme el tratamiento de conductos (endodoncia).`
        }
    ];

    useEffect(() => {
        if (patientId) loadData();
    }, [patientId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await patientConsentsApi.getByPatient(patientId);
            setConsents(data);
        } catch (error) {
            console.error('Error fetching consents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClearSignature = () => {
        sigCanvas.current.clear();
        setSignatureData(null);
    };

    const handleSave = async () => {
        if (!formData.treatment_name || !formData.content) {
            alert('Por favor complete el nombre del tratamiento y el contenido.');
            return;
        }

        const sigImage = sigCanvas.current.isEmpty() ? null : sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');

        try {
            await patientConsentsApi.create({
                patient_id: patientId,
                treatment_name: formData.treatment_name,
                content: formData.content,
                signature_data_url: sigImage,
                signed_at: sigImage ? new Date().toISOString() : null
            });
            setShowForm(false);
            setFormData({ treatment_name: '', content: '' });
            if (sigCanvas.current) sigCanvas.current.clear();
            loadData();
        } catch (error) {
            console.error('Error saving consent:', error);
            alert('Error al guardar el documento.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Eliminar este consentimiento? Esta acción es irreversible.')) {
            try {
                await patientConsentsApi.delete(id);
                loadData();
            } catch (error) {
                console.error('Error deleting consent:', error);
            }
        }
    };

    const handlePrint = (consent) => {
        setPrintingConsent(consent);
        setTimeout(() => {
            window.print();
            setPrintingConsent(null);
        }, 500);
    };

    const styles = {
        container: { display: 'flex', flexDirection: 'column', gap: '16px' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' },
        title: { margin: 0, fontSize: '16px', color: '#1e293b' },
        addButton: { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#0f766e', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' },
        card: { backgroundColor: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' },
        actions: { display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' },
        iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#64748b' },

        // Form
        formOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
        formModal: { backgroundColor: 'white', borderRadius: '16px', width: '600px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', padding: '24px' },
        label: { fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: '#64748b', marginBottom: '4px', display: 'block' },
        input: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', marginBottom: '16px' },
        textarea: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', minHeight: '150px', boxSizing: 'border-box', marginBottom: '16px', lineHeight: '1.5' },
        templatesBox: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' },
        templateChip: { backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', color: '#334155', fontWeight: '500' },
        signatureBox: { border: '2px dashed #cbd5e1', borderRadius: '12px', backgroundColor: '#f8fafc', overflow: 'hidden', position: 'relative' },
        clearSigBtn: { position: 'absolute', top: '8px', right: '8px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' },

        // Print
        printContainer: { display: 'none' } // Used in a separate print stylesheet logic usually, relying on media print
    };

    if (loading && consents.length === 0) return <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Cargando consentimientos...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h3 style={styles.title}>Consentimientos Informados</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Firmas digitales de pacientes</p>
                </div>
                <button style={styles.addButton} onClick={() => setShowForm(true)}>
                    <PenTool size={16} />
                    Nuevo Consentimiento
                </button>
            </div>

            {consents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                    <FileText size={48} color="#cbd5e1" style={{ marginBottom: '12px' }} />
                    <p style={{ color: '#64748b', margin: 0 }}>No hay consentimientos firmados aún.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {consents.map(c => (
                        <div key={c.id} style={styles.card}>
                            <h4 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '15px' }}>{c.treatment_name}</h4>
                            <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748b' }}>Generado el {new Date(c.created_at).toLocaleDateString()}</p>

                            {c.signature_data_url ? (
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                                    <img src={c.signature_data_url} alt="Firma" style={{ maxHeight: '60px', maxWidth: '100%' }} />
                                    <div style={{ fontSize: '11px', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px' }}>
                                        <CheckCircle size={12} /> Firmado el {new Date(c.signed_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ fontSize: '12px', color: '#ef4444', fontStyle: 'italic', padding: '8px', textAlign: 'center', border: '1px dashed #fca5a5', borderRadius: '8px' }}>
                                    Sin firma o pendiente
                                </div>
                            )}

                            <div style={styles.actions}>
                                <button style={{ ...styles.iconBtn, color: '#334155' }} onClick={() => handlePrint(c)} title="Imprimir/Descargar como PDF">
                                    <Printer size={16} />
                                </button>
                                <button style={{ ...styles.iconBtn, color: '#ef4444' }} onClick={() => handleDelete(c.id)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal para Crear Consentimiento */}
            {showForm && (
                <div style={styles.formOverlay} onClick={() => setShowForm(false)}>
                    <div style={styles.formModal} onClick={e => e.stopPropagation()}>
                        <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#0f172a' }}>Redactar Consentimiento</h2>

                        <div style={styles.templatesBox}>
                            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>Plantillas Rápidas:</span>
                            {templates.map((t, idx) => (
                                <span
                                    key={idx}
                                    style={styles.templateChip}
                                    onClick={() => setFormData({ treatment_name: t.name, content: t.content })}
                                >
                                    {t.name}
                                </span>
                            ))}
                        </div>

                        <label style={styles.label}>Tema / Tratamiento *</label>
                        <input
                            style={styles.input}
                            value={formData.treatment_name}
                            onChange={e => setFormData({ ...formData, treatment_name: e.target.value })}
                            placeholder="Ej: Odontosección y Ostectomía"
                        />

                        <label style={styles.label}>Contenido del Documento *</label>
                        <textarea
                            style={styles.textarea}
                            value={formData.content}
                            onChange={e => setFormData({ ...formData, content: e.target.value })}
                            placeholder="Redacte aquí los términos, riesgos y acuerdos. Puede usar las plantillas de arriba."
                        />

                        <label style={styles.label}>Firma Digital del Paciente</label>
                        <div style={styles.signatureBox}>
                            <SignatureCanvas
                                penColor='black'
                                canvasProps={{ width: 550, height: 150, className: 'sigCanvas' }}
                                ref={sigCanvas}
                                backgroundColor="#ffffff"
                            />
                            <button style={styles.clearSigBtn} onClick={handleClearSignature}>Limpiar Firma</button>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                            <button
                                onClick={() => setShowForm(false)}
                                style={{ padding: '10px 20px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                style={{ padding: '10px 20px', backgroundColor: '#0f766e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Guardar y Sellar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Componente Oculto para Impresión */}
            {printingConsent && (
                <div style={{ position: 'fixed', left: '-9999px', top: 0 }} className="print-only">
                    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
                        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                            <h1 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>CONSENTIMIENTO INFORMADO</h1>
                            <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 'normal' }}>{printingConsent.treatment_name}</h2>
                        </div>

                        <div style={{ fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap', marginBottom: '60px' }}>
                            {printingConsent.content}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '80px' }}>
                            <div style={{ textAlign: 'center', width: '300px' }}>
                                {printingConsent.signature_data_url ? (
                                    <img src={printingConsent.signature_data_url} alt="Firma Paciente" style={{ width: '200px', height: '60px', objectFit: 'contain', borderBottom: '1px solid black' }} />
                                ) : (
                                    <div style={{ width: '200px', height: '60px', borderBottom: '1px solid black', margin: '0 auto' }}></div>
                                )}
                                <p style={{ margin: '10px 0 0 0', fontWeight: 'bold' }}>Firma del Paciente</p>
                                <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>{patientName}</p>
                            </div>
                        </div>
                    </div>
                    {/* Add ad-hoc style for printing just this part */}
                    <style>{`
                        @media print {
                            body * { visibility: hidden; }
                            .print-only, .print-only * { visibility: visible; }
                            .print-only { position: absolute; left: 0; top: 0; width: 100%; }
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
}
