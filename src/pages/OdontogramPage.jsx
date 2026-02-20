import React, { useState, useCallback } from 'react';
import Odontograma from '../components/odontogram/Odontograma';
import Toolbar from '../components/odontogram/Toolbar';

/**
 * OdontogramPage - Página del Odontograma Clínico
 * Diseño inspirado en Dentino UI: bordes redondeados, sombras suaves, diseño limpio
 */
const OdontogramPage = () => {
    const [odontogramData, setOdontogramData] = useState({
        dientes: {},
        especificaciones: '',
    });
    const [selectedTool, setSelectedTool] = useState(null);
    const [selectedTooth, setSelectedTooth] = useState(null);

    const handleToothClick = useCallback((numero) => {
        setSelectedTooth(numero);

        if (selectedTool && selectedTool.aplicaATodo) {
            // Si es borrador, limpiar todo el diente
            if (selectedTool.id === 'borrador') {
                setOdontogramData(prev => {
                    const newDientes = { ...prev.dientes };
                    delete newDientes[numero];
                    return { ...prev, dientes: newDientes };
                });
            } else {
                setOdontogramData(prev => ({
                    ...prev,
                    dientes: {
                        ...prev.dientes,
                        [numero]: {
                            ...prev.dientes[numero],
                            [selectedTool.propiedad]: selectedTool.valor !== undefined
                                ? selectedTool.valor
                                : !prev.dientes[numero]?.[selectedTool.propiedad],
                        }
                    }
                }));
            }
        }
    }, [selectedTool]);

    const handleSurfaceClick = useCallback((numero, superficie) => {
        // Siempre actualizar el diente seleccionado
        setSelectedTooth(numero);

        if (!selectedTool) {
            return;
        }

        setOdontogramData(prev => {
            const dienteActual = prev.dientes[numero] || { superficies: {} };

            // Si es borrador, eliminar el marcado de la superficie
            if (selectedTool.id === 'borrador') {
                const nuevasSuperficies = { ...dienteActual.superficies };
                delete nuevasSuperficies[superficie];

                return {
                    ...prev,
                    dientes: {
                        ...prev.dientes,
                        [numero]: {
                            ...dienteActual,
                            superficies: nuevasSuperficies,
                        }
                    }
                };
            }

            // Lógica normal: toggle o aplicar procedimiento
            const superficieActual = dienteActual.superficies?.[superficie];

            const nuevoHallazgo = superficieActual?.hallazgo === selectedTool.id
                ? null
                : {
                    hallazgo: selectedTool.id,
                    color: selectedTool.color,
                    sigla: selectedTool.sigla,
                    relleno: selectedTool.relleno !== false,
                };

            return {
                ...prev,
                dientes: {
                    ...prev.dientes,
                    [numero]: {
                        ...dienteActual,
                        superficies: {
                            ...dienteActual.superficies,
                            [superficie]: nuevoHallazgo,
                        }
                    }
                }
            };
        });
    }, [selectedTool]);

    const handleSpecificationsChange = useCallback((value) => {
        setOdontogramData(prev => ({
            ...prev,
            especificaciones: value,
        }));
    }, []);

    // Check if on mobile (simple check, could use a hook for better reactivity)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    const styles = {
        page: {
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '24px',
            height: '100%',
            padding: '0',
            overflowX: 'auto', // Force horizontal scroll if needed
            overflowY: 'hidden',
        },
        toolbarColumn: {
            width: isMobile ? '100%' : '320px',
            flexShrink: 0,
            height: isMobile ? 'auto' : '100%',
            maxHeight: isMobile ? '200px' : 'none',
            overflow: isMobile ? 'auto' : 'hidden',
        },
        mainColumn: {
            flex: 1,
            overflow: 'auto', // Keeps its own internal scroll
            background: 'var(--bg-card)', // Adopt Theme variable while we're here
            borderRadius: '20px',
            boxShadow: 'var(--shadow-md)',
            padding: isMobile ? '12px' : '20px 24px',
            minWidth: '800px', // Prevent the odontogram from ever squishing
        },
    };

    return (
        <div style={styles.page}>
            {/* Panel de Herramientas */}
            <aside style={styles.toolbarColumn}>
                <Toolbar
                    selectedTool={selectedTool}
                    onSelectTool={setSelectedTool}
                    selectedTooth={selectedTooth}
                />
            </aside>

            {/* Área Principal del Odontograma */}
            <main style={styles.mainColumn}>
                <Odontograma
                    data={odontogramData}
                    selectedTool={selectedTool}
                    selectedTooth={selectedTooth}
                    onToothClick={handleToothClick}
                    onSurfaceClick={handleSurfaceClick}
                    onSpecificationsChange={handleSpecificationsChange}
                />
            </main>
        </div>
    );
};

export default OdontogramPage;
