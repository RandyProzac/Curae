import React, { useState, useEffect, useRef } from 'react';
import { Plus, Link2, X, Check, Search, ChevronDown } from 'lucide-react';
import { servicesApi, treatmentPlanApi } from '../../lib/supabase';
import { getProcedimientoById } from '../../data/procedures';

/**
 * TreatmentPlanTable
 * Renders findings extracted from odontogram data as a treatment plan.
 * Each finding row allows adding services from the catalog,
 * which auto-creates budget items linked to the finding.
 */
export default function TreatmentPlanTable({
    findings = [],
    planItems = [],
    patientId,
    onPlanUpdated,
    readOnly = false,
    pendingServices = {},
    onAddService,
    onRemoveService
}) {
    const [services, setServices] = useState([]);
    const [activePickerRow, setActivePickerRow] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const pickerRef = useRef(null);

    useEffect(() => {
        servicesApi.getAll().then(setServices).catch(console.warn);
    }, []);

    // Close picker on outside click
    useEffect(() => {
        const handler = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) {
                setActivePickerRow(null);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Merge findings with persisted plan items
    const mergedRows = findings.map(f => {
        const key = `${f.tooth_number}|${f.finding_type}|${f.surface || ''}`;
        const match = planItems.find(
            pi => `${pi.tooth_number}|${pi.finding_type}|${pi.surface || ''}` === key
        );
        // Only show budget items that belong to a DRAFT budget (status 'created')
        // Items in finalized budgets (status 'in_progress' or 'completed') should not appear here
        const activeServices = (match?.budget_items || []).filter(bi =>
            !bi.budget || bi.budget.status === 'created'
        );

        // Local pending services for this finding
        const local = pendingServices[key] || [];

        return {
            ...f,
            planItem: match || null,
            linkedServices: [...activeServices, ...local], // Combine DB and Local
        };
    });

    const procedure = (findingType) => getProcedimientoById(findingType);

    // Check if any finding has services linked
    const hasAnyServices = mergedRows.some(r => r.linkedServices.length > 0);

    const handleAddService = (finding, service) => {
        // Construct a service object compatible with budget_items
        const newService = {
            id: `temp-${Date.now()}`, // Temp ID for UI
            service_id: service.id,
            service_name: service.name,
            tooth_number: finding.tooth_number,
            unit_price: service.price,
            quantity: 1,
            isLocal: true, // Marker
            // Key info to link it back
            findingKey: `${finding.tooth_number}|${finding.finding_type}|${finding.surface || ''}`
        };

        if (onAddService) onAddService(newService);
        setActivePickerRow(null);
        setSearchTerm('');
    };

    const handleRemoveService = async (service) => {
        if (service.isLocal) {
            if (onRemoveService) onRemoveService(service);
        } else {
            try {
                await treatmentPlanApi.removeServiceFromFinding(service.id);
                onPlanUpdated?.();
            } catch (err) {
                console.error('Error removing service:', err);
            }
        }
    };




    const filteredServices = services.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groupedServices = filteredServices.reduce((acc, s) => {
        const cat = s.category || 'Otros';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(s);
        return acc;
    }, {});

    if (mergedRows.length === 0) {
        return (
            <div style={styles.emptyState}>
                <p style={styles.emptyText}>
                    No hay hallazgos registrados en el odontograma.
                </p>
                <p style={styles.emptyHint}>
                    Seleccione una herramienta y marque superficies para generar el plan de tratamiento.
                </p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h3 style={styles.title}>Plan de Tratamiento</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={styles.badge}>{mergedRows.length} hallazgo{mergedRows.length !== 1 ? 's' : ''}</span>
                </div>
            </div>

            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ ...styles.th, width: '80px' }}>N° diente</th>
                            <th style={{ ...styles.th, width: '35%' }}>Hallazgo</th>
                            <th style={styles.th}>Servicios</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mergedRows.map((row, idx) => {
                            const proc = procedure(row.finding_type);
                            const isPickerOpen = activePickerRow === idx;

                            return (
                                <tr key={`${row.tooth_number}-${row.finding_type}-${idx}`} style={styles.tr}>
                                    {/* Tooth number */}
                                    <td style={styles.td}>
                                        <span style={styles.toothNum}>{row.tooth_number}</span>
                                    </td>

                                    {/* Finding */}
                                    <td style={styles.td}>
                                        <div style={styles.findingCell}>
                                            <span
                                                style={{
                                                    ...styles.findingDot,
                                                    backgroundColor: row.color || proc?.color || '#94a3b8',
                                                }}
                                            />
                                            <span style={styles.findingText}>
                                                {proc?.nombre || row.finding_type}
                                                {row.surface && (
                                                    <span style={styles.surfaceLabel}> {row.surface}</span>
                                                )}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Services + Add button */}
                                    <td style={{ ...styles.td, position: 'relative' }}>
                                        <div style={styles.servicesCell}>
                                            {row.linkedServices.length > 0 && (
                                                row.linkedServices.map(bi => (
                                                    <div key={bi.id} style={styles.serviceChip}>
                                                        <Check size={12} style={{ color: '#10b981', flexShrink: 0 }} />
                                                        <span style={styles.serviceChipName}>{bi.service_name}</span>
                                                        <span style={styles.serviceChipPrice}>
                                                            S/ {parseFloat(bi.unit_price).toFixed(2)}
                                                        </span>
                                                        {!readOnly && (
                                                            <button
                                                                onClick={() => handleRemoveService(bi)}
                                                                style={styles.removeBtn}
                                                                title="Quitar servicio"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))
                                            )}

                                            {/* + Agregar button inside Servicios cell */}
                                            {!readOnly && (
                                                <button
                                                    onClick={() => {
                                                        setActivePickerRow(isPickerOpen ? null : idx);
                                                        setSearchTerm('');
                                                    }}
                                                    style={styles.addBtn}
                                                    title="Agregar servicio"
                                                >
                                                    <Plus size={14} />
                                                    <span>Agregar</span>
                                                </button>
                                            )}
                                        </div>

                                        {/* Service picker popover */}
                                        {isPickerOpen && (
                                            <div ref={pickerRef} style={styles.picker}>
                                                <div style={styles.pickerSearch}>
                                                    <Search size={14} style={{ color: '#94a3b8' }} />
                                                    <input
                                                        type="text"
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        placeholder="Buscar servicio..."
                                                        style={styles.pickerInput}
                                                        autoFocus
                                                    />
                                                </div>
                                                <div style={styles.pickerList}>
                                                    {Object.entries(groupedServices).map(([cat, svcList]) => (
                                                        <div key={cat}>
                                                            <div style={styles.pickerCategory}>{cat}</div>
                                                            {svcList.map(svc => {
                                                                const alreadyLinked = row.linkedServices.some(
                                                                    bi => bi.service_id === svc.id
                                                                );
                                                                return (
                                                                    <button
                                                                        key={svc.id}
                                                                        onClick={() => !alreadyLinked && handleAddService(row, svc)}
                                                                        style={{
                                                                            ...styles.pickerItem,
                                                                            opacity: alreadyLinked ? 0.5 : 1,
                                                                            cursor: alreadyLinked ? 'default' : 'pointer',
                                                                        }}
                                                                        disabled={alreadyLinked}
                                                                    >
                                                                        <span style={styles.pickerItemName}>{svc.name}</span>
                                                                        <span style={styles.pickerItemPrice}>
                                                                            S/ {parseFloat(svc.price).toFixed(2)}
                                                                        </span>
                                                                        {alreadyLinked && (
                                                                            <Check size={14} style={{ color: '#10b981' }} />
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    ))}
                                                    {filteredServices.length === 0 && (
                                                        <p style={styles.pickerEmpty}>No se encontraron servicios</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ============================================
// STYLES
// ============================================
const styles = {
    container: {
        marginTop: '16px',
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        // overflow: 'hidden', // Removed to allow picker to overflow
        position: 'relative', // Context for absolute positioning
        zIndex: 10,
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid #e2e8f0',
        background: '#f8fafc',
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px',
    },
    title: {
        fontSize: '16px',
        fontWeight: '700',
        color: '#1e293b',
        margin: 0,
    },
    badge: {
        fontSize: '12px',
        color: '#64748b',
        background: '#e2e8f0',
        padding: '2px 10px',
        borderRadius: '12px',
        fontWeight: '500',
    },
    tableWrapper: {
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px',
    },
    th: {
        textAlign: 'left',
        padding: '12px 16px',
        fontWeight: '600',
        fontSize: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        background: '#334155',
        color: 'white',
        borderBottom: '2px solid #1e293b',
    },
    tr: {
        borderBottom: '1px solid #f1f5f9',
        transition: 'background 0.15s',
    },
    td: {
        padding: '12px 16px',
        verticalAlign: 'top',
    },
    toothNum: {
        fontFamily: 'monospace',
        fontWeight: '700',
        fontSize: '16px',
        color: '#334155',
    },
    findingCell: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
    },
    findingDot: {
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        marginTop: '4px',
        flexShrink: 0,
    },
    findingText: {
        fontSize: '14px',
        color: '#334155',
        lineHeight: 1.4,
    },
    surfaceLabel: {
        color: '#64748b',
        fontSize: '12px',
    },
    servicesCell: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    serviceChip: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 8px',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        fontSize: '13px',
        background: '#f8fafc',
    },
    serviceChipName: {
        flex: 1,
        color: '#334155',
        fontWeight: '500',
    },
    serviceChipPrice: {
        color: '#059669',
        fontWeight: '600',
        fontSize: '12px',
        whiteSpace: 'nowrap',
    },
    removeBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#94a3b8',
        padding: '2px',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
    },
    noService: {
        fontSize: '12px',
        color: '#94a3b8',
        fontStyle: 'italic',
    },
    actionCell: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        alignItems: 'flex-start',
    },
    addBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '6px 12px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '500',
        color: '#0f766e',
        background: '#f0fdfa',
        transition: 'all 0.15s',
    },
    // Picker styles
    picker: {
        position: 'absolute',
        bottom: '100%',
        left: 0,
        right: 0,
        zIndex: 9999,
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        boxShadow: '0 -8px 24px rgba(0,0,0,0.12)',
        maxHeight: '320px',
        display: 'flex',
        flexDirection: 'column',
        minWidth: '300px',
        marginBottom: '4px',
    },
    pickerSearch: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 12px',
        borderBottom: '1px solid #f1f5f9',
    },
    pickerInput: {
        flex: 1,
        border: 'none',
        outline: 'none',
        fontSize: '13px',
        color: '#334155',
        background: 'transparent',
    },
    pickerList: {
        overflowY: 'auto',
        flex: 1,
        padding: '4px',
    },
    pickerCategory: {
        padding: '8px 12px 4px',
        fontSize: '11px',
        fontWeight: '700',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    pickerItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        padding: '8px 12px',
        border: 'none',
        borderRadius: '6px',
        background: 'transparent',
        textAlign: 'left',
        fontSize: '13px',
        cursor: 'pointer',
        transition: 'background 0.1s',
    },
    pickerItemName: {
        flex: 1,
        color: '#334155',
    },
    pickerItemPrice: {
        color: '#059669',
        fontWeight: '600',
        fontSize: '12px',
    },
    pickerEmpty: {
        padding: '16px',
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: '13px',
    },
    emptyState: {
        marginTop: '24px',
        padding: '32px',
        textAlign: 'center',
        background: '#f8fafc',
        borderRadius: '12px',
        border: '1px dashed #cbd5e1',
    },
    emptyText: {
        fontSize: '15px',
        fontWeight: '600',
        color: '#64748b',
        marginBottom: '8px',
    },
    emptyHint: {
        fontSize: '13px',
        color: '#94a3b8',
    },
    noteInput: {
        width: '100%',
        minWidth: '100px',
        padding: '6px 8px',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#334155',
        background: '#fafafa',
        resize: 'vertical',
        fontFamily: 'inherit',
        outline: 'none',
        transition: 'border-color 0.15s',
    },
    savingIndicator: {
        position: 'absolute',
        bottom: '-14px',
        right: '0',
        fontSize: '10px',
        color: '#94a3b8',
        fontStyle: 'italic',
    },
};
