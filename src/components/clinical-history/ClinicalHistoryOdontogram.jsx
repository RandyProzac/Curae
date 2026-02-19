import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Save, CheckCircle, AlertCircle, AlertTriangle, X } from 'lucide-react';

import Odontograma from '../odontogram/Odontograma';
import Toolbar from '../odontogram/Toolbar';
import TreatmentPlanTable from '../odontogram/TreatmentPlanTable';
// ClinicalHistoryNotes removed
import { extractFindings, treatmentPlanApi, supabase } from '../../lib/supabase';
import styles from './ClinicalHistory.module.css';

const ClinicalHistoryOdontogram = ({
    patientId,
    data,
    onDataChange,
    activeType,
    onTypeChange,
    onCreateBudget,
    readOnly = false,
    snapshotId = null,
}) => {
    const [selectedTool, setSelectedTool] = useState(null);
    const [selectedTooth, setSelectedTooth] = useState(null);
    const [planItems, setPlanItems] = useState([]);
    const [findings, setFindings] = useState([]);
    // Local pending services before save
    const [pendingServices, setPendingServices] = useState({});

    // Plan State
    const [planTitle, setPlanTitle] = useState('');
    // Initialize with 3 empty bullets
    const [notesList, setNotesList] = useState(['', '', '']);
    const [loading, setLoading] = useState(false);
    // Toast notification
    const [toast, setToast] = useState(null);
    const toastTimeout = useRef(null);

    const showToast = (message, type = 'success') => {
        if (toastTimeout.current) clearTimeout(toastTimeout.current);
        setToast({ message, type });
        toastTimeout.current = setTimeout(() => setToast(null), 3500);
    };
    const odontogramRef = useRef(null);

    const handleSavePlan = async () => {
        if (!planTitle.trim()) {
            showToast('Por favor, ingrese un título para el Plan de Tratamiento.', 'warning');
            return;
        }

        try {
            setLoading(true);

            // 1. Sync Findings (Ensures DB has all current findings with IDs)
            const currentPlanItems = await treatmentPlanApi.syncFromOdontogram(patientId, snapshotId, data);

            // 2. Access or Create Draft Budget
            let budgetId = null;
            const { data: budgets } = await supabase
                .from('budgets')
                .select('id')
                .eq('patient_id', patientId)
                .eq('status', 'created')
                .order('created_at', { ascending: false })
                .limit(1);

            if (budgets && budgets.length > 0) {
                budgetId = budgets[0].id;
            } else {
                // Create new budget if none exists
                const { data: newBudget, error: budgetError } = await supabase
                    .from('budgets')
                    .insert({
                        patient_id: patientId,
                        title: 'Plan de Tratamiento',
                        status: 'created',
                        is_treatment_plan: true,
                    })
                    .select()
                    .single();
                if (budgetError) throw budgetError;
                budgetId = newBudget.id;
            }

            // 3. Save Pending Services to Budget
            for (const [key, services] of Object.entries(pendingServices)) {
                if (!services || services.length === 0) continue;

                const [tooth, type, surface] = key.split('|');

                // Find matching finding ID
                const match = currentPlanItems.find(item =>
                    String(item.tooth_number) === String(tooth) &&
                    item.finding_type === type &&
                    (item.surface || '') === (surface || '')
                );

                if (match) {
                    const budgetItems = services.map(svc => ({
                        budget_id: budgetId,
                        finding_id: match.id, // Link to the finding
                        service_id: svc.service_id,
                        service_name: svc.service_name,
                        tooth_number: svc.tooth_number || null,
                        quantity: svc.quantity || 1,
                        unit_price: svc.unit_price,
                        discount: 0,
                        discount_type: 'fixed',
                        notes: null
                    }));

                    const { error: itemsError } = await supabase
                        .from('budget_items')
                        .insert(budgetItems);

                    if (itemsError) console.error('Error inserting budget items for', key, itemsError);
                } else {
                    console.warn('Could not find matching finding for service key:', key);
                }
            }

            // 4. Finalize Budget (Set to Active)
            await supabase
                .from('budgets')
                .update({ status: 'active' })
                .eq('id', budgetId);

            // 5. Save Treatment Plan Header
            // Join notes with bullets for storage
            const finalNotes = notesList
                .map(n => n.trim())
                .filter(n => n.length > 0)
                .map(n => `• ${n}`)
                .join('\n');

            const { error: saveError } = await supabase.from('treatment_plans').insert({
                patient_id: patientId,
                title: planTitle,
                notes: finalNotes,
                odontogram_data: data, // Save the JSON state
                budget_id: budgetId,
                status: 'active'
            });

            if (saveError) throw saveError;

            showToast('Plan de Tratamiento guardado exitosamente.', 'success');
            setPlanTitle('');
            setNotesList(['', '', '']);
            setPendingServices({}); // Clear local services
            await loadPlanItems(); // Refresh items to show everything as persisted

        } catch (error) {
            console.error('Error saving plan:', error);
            showToast('Error al guardar: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Extract findings from odontogram data whenever it changes
    useEffect(() => {
        const extracted = extractFindings(data);
        setFindings(extracted);
    }, [data]);

    // Load persisted plan items
    const loadPlanItems = useCallback(async () => {
        if (!patientId) return;
        const items = await treatmentPlanApi.getByPatient(patientId);
        setPlanItems(items);
    }, [patientId]);

    useEffect(() => {
        loadPlanItems();
    }, [loadPlanItems]);

    // Sync findings to DB when odontogram data changes (debounced)
    // REMOVED: Auto-sync is disabled. Findings are synced only on "Save Plan".
    /*
    useEffect(() => {
        if (!patientId || findings.length === 0) return;

        const timer = setTimeout(async () => {
            await treatmentPlanApi.syncFromOdontogram(patientId, snapshotId, data);
            await loadPlanItems();
        }, 1500); // debounce 1.5s to avoid rapid calls while user is clicking

        return () => clearTimeout(timer);
    }, [findings, patientId, snapshotId]); 
    */

    const handleToothClick = (numero) => {
        if (readOnly) return;
        if (selectedTool?.id === 'borrador') {
            const newData = JSON.parse(JSON.stringify(data));
            if (!newData.dientes) newData.dientes = {};
            newData.dientes[numero] = { superficies: {}, hallazgos: [] };
            onDataChange(newData);
            return;
        }
        setSelectedTooth(selectedTooth === numero ? null : numero);
    };

    const handleSurfaceClick = (numero, superficie) => {
        if (readOnly || !selectedTool) return;

        const newData = { ...data };
        if (!newData.dientes) newData.dientes = {};
        if (!newData.dientes[numero]) newData.dientes[numero] = { superficies: {}, hallazgos: [] };
        if (!newData.dientes[numero].superficies) newData.dientes[numero].superficies = {};
        if (!newData.dientes[numero].hallazgos) newData.dientes[numero].hallazgos = [];

        const tool = selectedTool;

        // ERASER
        if (tool.id === 'borrador') {
            newData.dientes[numero] = { superficies: {}, hallazgos: [] };
            onDataChange(newData);
            return;
        }

        const tipoApp = tool.tipoAplicacion;

        // SURFACE-BASED procedures (caries, amalgama, resina, etc.)
        if (tipoApp === 'superficie') {
            newData.dientes[numero].superficies[superficie] = {
                hallazgo: tool.id,
                color: tool.color,
                relleno: tool.relleno !== false,
            };
            onDataChange(newData);
            return;
        }

        // WHOLE-TOOTH, CORONA, RAIZ procedures — add to hallazgos array
        // Toggle: if this hallazgo already exists, remove it; otherwise add it
        const existingIdx = newData.dientes[numero].hallazgos.findIndex(h => h.id === tool.id);
        if (existingIdx >= 0) {
            // Remove it (toggle off)
            newData.dientes[numero].hallazgos.splice(existingIdx, 1);
        } else {
            // Add it
            newData.dientes[numero].hallazgos.push({
                id: tool.id,
                color: tool.color,
                sigla: tool.sigla || null,
            });
        }

        onDataChange(newData);
    };

    const handleSpecificationsChange = (text) => {
        if (readOnly) return;
        onDataChange({ ...data, especificaciones: text });
    };

    const handleAddService = (service) => {
        setPendingServices(prev => {
            const key = service.findingKey;
            const current = prev[key] || [];
            return { ...prev, [key]: [...current, service] };
        });
    };

    const handleRemoveService = (service) => {
        setPendingServices(prev => {
            const key = service.findingKey;
            const current = prev[key] || [];
            return { ...prev, [key]: current.filter(s => s.id !== service.id) };
        });
    };

    const handleNoteChange = (index, value) => {
        const newNotes = [...notesList];
        newNotes[index] = value;

        // Auto-add new line if writing in the last one
        if (index === newNotes.length - 1 && value.trim() !== '') {
            newNotes.push('');
        }

        setNotesList(newNotes);
    };

    const handleNoteBlur = (index) => {
        // If an item is empty and it is NOT the last item, remove it.
        // We also want to keep at least one item if all are deleted (but the logic below handles that by keeping the last one)
        /* 
           Logic:
           Filter out empty strings efficiently, but ALWAYS ensure the last item remains (even if empty) to allow typing.
           Actually, if I delete item 2 of 5, I want it gone.
           So: filter all empty items, THEN ensure there's at least one empty item at the end.
        */

        // Wait a tick to ensure we don't conflict with focus events or the "add new" logic
        setTimeout(() => {
            setNotesList(prev => {
                // Remove empty notes, but we must handle the "last one empty" rule carefully.
                // It's easier to just remove all empty notes except the very last one.

                // Let's filter: keep if not empty OR if it is the last index
                const filtered = prev.filter((note, idx) => note.trim() !== '' || idx === prev.length - 1);

                // If the resulting list has no empty last item (e.g. user filled the last one and then blurred), add one
                if (filtered.length === 0 || filtered[filtered.length - 1].trim() !== '') {
                    filtered.push('');
                }

                return filtered;
            });
        }, 100);
    };

    return (
        <div className={styles.tabContent}>


            <div className={styles.odontogramContainer} ref={odontogramRef}>
                <div style={{ pointerEvents: readOnly ? 'none' : 'auto', opacity: readOnly ? 0.7 : 1 }}>
                    <Toolbar
                        selectedTool={selectedTool}
                        onSelectTool={setSelectedTool}
                        selectedTooth={selectedTooth}
                    />
                </div>

                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <Odontograma
                        data={data}
                        selectedTool={selectedTool}
                        onToothClick={handleToothClick}
                        onSurfaceClick={handleSurfaceClick}
                        onSpecificationsChange={handleSpecificationsChange}
                        selectedTooth={selectedTooth}
                        showSpecifications={false}
                    />
                </div>
            </div>

            {/* Treatment Plan Table — generated from odontogram findings */}
            <TreatmentPlanTable
                findings={findings}
                planItems={planItems}
                patientId={patientId}
                onPlanUpdated={loadPlanItems}
                onCreateBudget={onCreateBudget}
                readOnly={readOnly}
                pendingServices={pendingServices}
                onAddService={handleAddService}
                onRemoveService={handleRemoveService}
            />

            {/* Notas del Plan */}
            <div style={{ marginTop: '16px', padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Notas</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {notesList.map((note, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '18px', color: '#94a3b8', lineHeight: 1 }}>•</span>
                            <input
                                type="text"
                                value={note}
                                onChange={(e) => handleNoteChange(idx, e.target.value)}
                                onBlur={() => handleNoteBlur(idx)}
                                placeholder={idx === 0 ? "Agregar nota..." : ""}
                                style={{
                                    flex: 1,
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '14px',
                                    outline: 'none',
                                    background: '#fafafa'
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Plan Header (moved to bottom) */}
            <div style={{
                marginTop: '16px',
                padding: '20px',
                background: 'white',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
            }}>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Guardar Plan de Tratamiento</h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>
                            TÍTULO
                        </label>
                        <input
                            type="text"
                            value={planTitle}
                            onChange={(e) => setPlanTitle(e.target.value)}
                            placeholder="Ej: Ortodoncia Fase 1, Implante 2.4, etc."
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <div>
                        <button
                            onClick={handleSavePlan}
                            disabled={loading}
                            className={styles.btnPrimary}
                            style={{ height: '42px', marginTop: '18px' }}
                        >
                            {loading ? 'Guardando...' : (
                                <>
                                    <Save size={18} />
                                    <span>Guardar</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Toast Notification */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 20px',
                    borderRadius: '12px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                    background: toast.type === 'success' ? '#f0fdf4'
                        : toast.type === 'error' ? '#fef2f2'
                            : '#fffbeb',
                    border: `1px solid ${toast.type === 'success' ? '#bbf7d0'
                        : toast.type === 'error' ? '#fecaca'
                            : '#fde68a'}`,
                    color: toast.type === 'success' ? '#166534'
                        : toast.type === 'error' ? '#991b1b'
                            : '#92400e',
                    fontSize: '14px',
                    fontWeight: '500',
                    maxWidth: '400px',
                    animation: 'slideInRight 0.3s ease',
                }}>
                    {toast.type === 'success' && <CheckCircle size={20} style={{ color: '#22c55e', flexShrink: 0 }} />}
                    {toast.type === 'error' && <AlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />}
                    {toast.type === 'warning' && <AlertTriangle size={20} style={{ color: '#f59e0b', flexShrink: 0 }} />}
                    <span style={{ flex: 1 }}>{toast.message}</span>
                    <button
                        onClick={() => setToast(null)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'inherit',
                            opacity: 0.6,
                            padding: '2px',
                            flexShrink: 0,
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            <style>{`
            @keyframes slideInRight {
                from { transform: translateX(100px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `}</style>
        </div>
    );
};

export default ClinicalHistoryOdontogram;
