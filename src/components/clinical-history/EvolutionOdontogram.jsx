import React, { useState, useEffect, useRef } from 'react';
import { Save, AlertCircle, CheckCircle, Eraser, Check, X, Search } from 'lucide-react';
import Odontograma from '../odontogram/Odontograma';
import { PROCEDIMIENTOS } from '../../data/procedures';
import { COLORS } from '../../utils/constants';

// Quick-access tools for Evolution mode
const QUICK_TOOLS = [
    PROCEDIMIENTOS.CARIES,
    PROCEDIMIENTOS.RESTAURACION_RESINA,
    PROCEDIMIENTOS.RESTAURACION_AMALGAMA,
    PROCEDIMIENTOS.CORONA,
    PROCEDIMIENTOS.ENDODONCIA,
    PROCEDIMIENTOS.SELLANTES,
    PROCEDIMIENTOS.RESTAURACION_TEMPORAL,
];

// Helper: is a color "red" (pathological)?
const isRedColor = (color) => {
    if (!color) return false;
    const c = color.toLowerCase();
    return c === '#ff0000' || c === '#dc2626' || c === 'red';
};

// Helper: is a color "blue" (treated)?
const isBlueColor = (color) => {
    if (!color) return false;
    const c = color.toLowerCase();
    return c === '#0000ff' || c === '#2563eb' || c === 'blue';
};

const EvolutionOdontogram = ({
    planId,
    initialData,
    evolutionData,
    onSave,
}) => {
    const hasEvolutionContent = evolutionData && evolutionData.dientes && Object.keys(evolutionData.dientes).length > 0;
    const [currentData, setCurrentData] = useState(hasEvolutionContent ? evolutionData : (initialData || {}));
    const [selectedTool, setSelectedTool] = useState(null);
    const [selectedTooth, setSelectedTooth] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchRef = useRef(null);
    const inputRef = useRef(null);

    // All procedures filter
    const allProcedures = Object.values(PROCEDIMIENTOS).filter(p => !p.esHerramienta);
    const filteredProcedures = searchQuery.trim()
        ? allProcedures.filter(p =>
            p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.sigla && p.sigla.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        : [];

    useEffect(() => {
        const hasEvo = evolutionData && evolutionData.dientes && Object.keys(evolutionData.dientes).length > 0;
        if (hasEvo) {
            setCurrentData(evolutionData);
        } else if (initialData) {
            setCurrentData(initialData);
        }
    }, [evolutionData, initialData]);

    // Close search on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setIsSearchOpen(false);
                setSearchQuery('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const handleToothClick = (numero) => {
        if (selectedTool?.id === 'borrador') {
            const newData = JSON.parse(JSON.stringify(currentData));
            if (!newData.dientes) newData.dientes = {};
            newData.dientes[numero] = { superficies: {}, hallazgos: [] };
            setCurrentData(newData);
            showToast('Pieza limpiada', 'info');
            return;
        }
        setSelectedTooth(selectedTooth === numero ? null : numero);
    };

    const handleSurfaceClick = (numero, superficie) => {
        if (!selectedTool) return;

        const newData = JSON.parse(JSON.stringify(currentData));
        if (!newData.dientes) newData.dientes = {};
        if (!newData.dientes[numero]) newData.dientes[numero] = { superficies: {}, hallazgos: [] };
        if (!newData.dientes[numero].superficies) newData.dientes[numero].superficies = {};
        if (!newData.dientes[numero].hallazgos) newData.dientes[numero].hallazgos = [];

        const tool = selectedTool;

        // ERASER
        // ERASER
        if (tool.id === 'borrador') {
            newData.dientes[numero] = { superficies: {}, hallazgos: [] };
            setCurrentData(newData);
            return;
        }

        // CURAR — change red (pathological) to blue (treated)
        if (tool.id === 'curar') {
            const currentSurface = newData.dientes[numero]?.superficies?.[superficie];

            if (currentSurface && isRedColor(currentSurface.color)) {
                let newId = 'restauracion_resina';
                if (currentSurface.hallazgo && currentSurface.hallazgo.includes('caries')) newId = 'restauracion_resina';

                newData.dientes[numero].superficies[superficie] = {
                    ...currentSurface,
                    color: COLORS.AZUL,
                    hallazgo: newId,
                };
                showToast('✓ Superficie curada', 'success');
            } else if (currentSurface && isBlueColor(currentSurface.color)) {
                showToast('Esta superficie ya está tratada', 'success');
            } else {
                showToast('No hay hallazgo patológico para curar aquí', 'error');
            }

            // Also check whole-tooth hallazgos and cure any red ones
            const hallazgos = newData.dientes[numero].hallazgos;
            let curedAny = false;
            for (let i = hallazgos.length - 1; i >= 0; i--) {
                if (isRedColor(hallazgos[i].color)) {
                    hallazgos[i] = { ...hallazgos[i], color: COLORS.AZUL };
                    curedAny = true;
                }
            }
            if (curedAny && !currentSurface) {
                showToast('✓ Pieza curada (hallazgos tratados)', 'success');
            }

            setCurrentData(newData);
            return;
        }

        const tipoApp = tool.tipoAplicacion;

        // SURFACE-BASED
        if (tipoApp === 'superficie') {
            newData.dientes[numero].superficies[superficie] = {
                hallazgo: tool.id,
                color: tool.color,
                relleno: tool.relleno !== false,
            };
            setCurrentData(newData);
            return;
        }

        // WHOLE-TOOTH / GENERAL
        const existingIdx = newData.dientes[numero].hallazgos.findIndex(h => h.id === tool.id);
        if (existingIdx >= 0) {
            newData.dientes[numero].hallazgos.splice(existingIdx, 1);
        } else {
            newData.dientes[numero].hallazgos.push({
                id: tool.id,
                color: tool.color,
                sigla: tool.sigla || null,
            });
        }
        setCurrentData(newData);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await onSave(currentData);
            showToast('Evolución guardada correctamente', 'success');
        } catch (err) {
            console.error(err);
            showToast('Error al guardar evolución', 'error');
        } finally {
            setLoading(false);
        }
    };

    const selectTool = (tool) => {
        onSelectTool(tool);
    };

    const onSelectTool = (tool) => {
        setSelectedTool(prev => (prev?.id === tool?.id ? null : tool));
    };

    const handleSelectFromSearch = (procedure) => {
        onSelectTool(selectedTool?.id === procedure.id ? null : procedure);
        setSearchQuery('');
        setIsSearchOpen(false);
    };

    const toolbarStyles = {
        wrapper: {
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            padding: '8px 12px',
            gap: '12px',
            flexWrap: 'wrap',
        },
        toolBtn: (isSelected, color) => ({
            padding: '5px 8px',
            borderRadius: '6px',
            border: `1.5px solid ${isSelected ? (color || '#334155') : '#e2e8f0'}`,
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: '600',
            background: isSelected ? (color || '#334155') : '#ffffff',
            color: isSelected ? '#ffffff' : (color || '#334155'),
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
        }),
        specialBtn: (isSelected, bgGrad, bgGradHover, textColor) => ({
            padding: '6px 12px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
            background: isSelected ? bgGradHover : bgGrad,
            color: isSelected ? '#ffffff' : textColor,
            boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
        }),
        dot: (color) => ({
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: color,
            flexShrink: 0,
        }),
        saveBtnContainer: {
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
        },
        saveBtn: {
            padding: '6px 14px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            background: '#4f46e5',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
            boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
        },
        searchInput: {
            padding: '6px 10px 6px 28px',
            borderRadius: '8px',
            border: '1.5px solid #e2e8f0',
            fontSize: '12px',
            outline: 'none',
            width: '240px',
            background: '#f8fafc',
            transition: 'all 0.2s',
        },
        dropdown: {
            position: 'absolute',
            top: '36px',
            left: 0,
            width: '300px',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0',
            zIndex: 50,
            maxHeight: '200px',
            overflowY: 'auto',
        },
        dropdownItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 10px',
            width: '100%',
            textAlign: 'left',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            borderBottom: '1px solid #f1f5f9',
        },
        separator: {
            width: '1px',
            height: '20px',
            background: '#e2e8f0',
            margin: '0 4px',
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
            {/* Single Row Toolbar */}
            <div style={toolbarStyles.wrapper}>
                {/* Borrador */}
                <button
                    onClick={() => onSelectTool({
                        id: 'borrador', nombre: 'Borrador',
                        descripcion: 'Eliminar marcado', color: null, esHerramienta: true,
                    })}
                    style={toolbarStyles.specialBtn(
                        selectedTool?.id === 'borrador',
                        '#f1f5f9', '#dc2626', '#64748b'
                    )}
                    title="Borrador"
                >
                    <Eraser size={14} />
                    Borrador
                </button>

                {/* Curar */}
                <button
                    onClick={() => onSelectTool({
                        id: 'curar', nombre: 'Curar',
                        descripcion: 'Cambiar hallazgo patológico a tratado', color: null, esHerramienta: true,
                    })}
                    style={toolbarStyles.specialBtn(
                        selectedTool?.id === 'curar',
                        '#ecfdf5', '#059669', '#059669'
                    )}
                    title="Curar: cambia rojo → azul"
                >
                    <Check size={14} />
                    Curar
                </button>

                <div style={toolbarStyles.separator} />

                {/* Search */}
                <div style={{ position: 'relative' }} ref={searchRef}>
                    <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Buscar procedimiento..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setIsSearchOpen(true);
                        }}
                        onFocus={() => setIsSearchOpen(true)}
                        style={toolbarStyles.searchInput}
                    />
                    {isSearchOpen && searchQuery.trim() && (
                        <div style={toolbarStyles.dropdown}>
                            {filteredProcedures.length === 0 ? (
                                <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                                    Sin resultados
                                </div>
                            ) : (
                                filteredProcedures.map((proc) => (
                                    <button
                                        key={proc.id}
                                        onClick={() => handleSelectFromSearch(proc)}
                                        style={toolbarStyles.dropdownItem}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                    >
                                        <span style={toolbarStyles.dot(proc.color)} />
                                        {proc.nombre}
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Update Button (Moved to Toolbar) */}
                <div style={toolbarStyles.saveBtnContainer}>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        style={{
                            ...toolbarStyles.saveBtn,
                            opacity: loading ? 0.7 : 1,
                            cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                    >
                        <Save size={14} />
                        {loading ? 'Actualizando...' : 'Actualizar Odontograma'}
                    </button>
                </div>
            </div>

            {/* Active tool indicator */}
            {selectedTool && (
                <div style={{
                    padding: '6px 16px',
                    background: '#0f172a',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                }}>
                    <span>
                        <strong>Herramienta activa:</strong> {selectedTool.nombre}
                        {selectedTool.id === 'curar' && ' — Haz clic en una superficie roja para curarla'}
                    </span>
                    <button
                        onClick={() => setSelectedTool(null)}
                        style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '4px', padding: '3px 6px', cursor: 'pointer', color: '#94a3b8' }}
                    >
                        <X size={12} />
                    </button>
                </div>
            )}

            {/* Odontogram Area */}
            <div style={{ flex: 1, overflow: 'auto', padding: '0.5rem', position: 'relative' }}>
                <Odontograma
                    data={currentData}
                    selectedTool={selectedTool}
                    onToothClick={handleToothClick}
                    onSurfaceClick={handleSurfaceClick}
                    onSpecificationsChange={() => { }}
                    selectedTooth={selectedTooth}
                    showSpecifications={false}
                    showHeader={true}
                />
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
                    background: toast.type === 'success' ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${toast.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                    color: toast.type === 'success' ? '#166534' : '#991b1b',
                    fontSize: '14px',
                    fontWeight: '500',
                    maxWidth: '400px',
                    animation: 'slideInRight 0.3s ease',
                }}>
                    {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <span>{toast.message}</span>
                </div>
            )}
        </div>
    );
};

export default EvolutionOdontogram;

