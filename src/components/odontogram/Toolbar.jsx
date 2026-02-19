import { useState, useRef, useEffect } from 'react'
import { Search, X, Eraser } from 'lucide-react'
import { PROCEDIMIENTOS, CATEGORIAS_DISPLAY, getProcedimientosByCategoria } from '../../data/procedures'
import { COLORS } from '../../utils/constants'

// Quick-access hallazgos that appear as buttons at the top
const QUICK_ACCESS = [
  PROCEDIMIENTOS.CARIES,
  PROCEDIMIENTOS.RESTAURACION_RESINA,
  PROCEDIMIENTOS.RESTAURACION_AMALGAMA,
  PROCEDIMIENTOS.CORONA,
  PROCEDIMIENTOS.ENDODONCIA,
  PROCEDIMIENTOS.DIENTE_AUSENTE,
  PROCEDIMIENTOS.EXTRACCION,
  PROCEDIMIENTOS.SELLANTES,
  PROCEDIMIENTOS.RESTAURACION_TEMPORAL,
]

/**
 * Toolbar - Panel de herramientas compacto para el Odontograma
 * Diseño: Quick buttons + Search bar
 */
export default function Toolbar({
  selectedTool,
  onSelectTool,
  selectedTooth,
  showCureTool = false,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchRef = useRef(null)
  const inputRef = useRef(null)

  // All procedures as flat array (excluding eraser tool)
  const allProcedures = Object.values(PROCEDIMIENTOS).filter(p => !p.esHerramienta)

  // Filtered procedures based on search
  const filteredProcedures = searchQuery.trim()
    ? allProcedures.filter(p =>
      p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sigla && p.sigla.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : []

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false)
        setSearchQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus input when search opens
  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isSearchOpen])

  const handleSelectFromSearch = (procedure) => {
    onSelectTool(selectedTool?.id === procedure.id ? null : procedure)
    setSearchQuery('')
    setIsSearchOpen(false)
  }

  const styles = {
    container: {
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
      overflow: 'visible',
      display: 'flex',
      flexDirection: 'column',
      gap: '0',
    },
    header: {
      padding: '16px 16px 12px',
      borderBottom: '1px solid #f1f5f9',
    },
    title: {
      fontSize: '16px',
      fontWeight: '700',
      color: '#1e293b',
      marginBottom: '2px',
    },
    subtitle: {
      fontSize: '12px',
      color: '#64748b',
    },
    // Active tool indicator
    activeToolBar: {
      margin: '0 12px',
      padding: '10px 14px',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      borderRadius: '10px',
      color: 'white',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    // Quick access buttons area
    quickAccessArea: {
      padding: '12px',
    },
    quickAccessLabel: {
      fontSize: '10px',
      fontWeight: '600',
      color: '#94a3b8',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '8px',
    },
    quickGrid: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px',
    },
    quickBtn: {
      padding: '7px 12px',
      borderRadius: '8px',
      border: '1.5px solid',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '600',
      transition: 'all 0.15s ease',
      whiteSpace: 'nowrap',
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
    },
    // Search area
    searchArea: {
      padding: '0 12px 12px',
      position: 'relative',
    },
    searchInput: {
      width: '100%',
      padding: '10px 14px 10px 36px',
      borderRadius: '10px',
      border: '1.5px solid #e2e8f0',
      fontSize: '13px',
      color: '#1e293b',
      background: '#f8fafc',
      outline: 'none',
      transition: 'all 0.2s',
      boxSizing: 'border-box',
    },
    searchIcon: {
      position: 'absolute',
      left: '24px',
      top: '11px',
      color: '#94a3b8',
      pointerEvents: 'none',
    },
    // Search results dropdown
    dropdown: {
      position: 'absolute',
      top: '44px',
      left: '12px',
      right: '12px',
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
      maxHeight: '280px',
      overflowY: 'auto',
      zIndex: 100,
    },
    dropdownItem: {
      width: '100%',
      padding: '10px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      border: 'none',
      background: 'none',
      cursor: 'pointer',
      fontSize: '13px',
      color: '#334155',
      textAlign: 'left',
      transition: 'background 0.1s',
      borderBottom: '1px solid #f1f5f9',
    },
    colorDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      flexShrink: 0,
    },
    sigla: {
      fontFamily: 'monospace',
      fontWeight: '700',
      fontSize: '10px',
      padding: '2px 5px',
      borderRadius: '4px',
      marginLeft: 'auto',
    },
    // Eraser  
    eraserArea: {
      padding: '0 12px 12px',
    },
    // Legend
    legend: {
      padding: '12px',
      borderTop: '1px solid #f1f5f9',
      display: 'flex',
      gap: '16px',
      justifyContent: 'center',
    },
    legendItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '11px',
      color: '#64748b',
    },
  }

  const renderQuickButton = (procedure) => {
    const isSelected = selectedTool?.id === procedure.id
    const isRed = procedure.color === COLORS.ROJO
    const isYellow = procedure.color === COLORS.AMARILLO

    let bg, color, borderColor
    if (isSelected) {
      bg = isRed ? '#dc2626' : isYellow ? '#d97706' : '#2563eb'
      color = 'white'
      borderColor = bg
    } else {
      bg = 'white'
      color = isRed ? '#dc2626' : isYellow ? '#92400e' : '#2563eb'
      borderColor = isRed ? '#fca5a5' : isYellow ? '#fcd34d' : '#93c5fd'
    }

    return (
      <button
        key={procedure.id}
        onClick={() => onSelectTool(isSelected ? null : procedure)}
        style={{
          ...styles.quickBtn,
          background: bg,
          color: color,
          borderColor: borderColor,
          boxShadow: isSelected ? `0 2px 8px ${bg}40` : 'none',
        }}
        onMouseEnter={(e) => {
          if (!isSelected) e.currentTarget.style.background = isRed ? '#fef2f2' : isYellow ? '#fffbeb' : '#eff6ff'
        }}
        onMouseLeave={(e) => {
          if (!isSelected) e.currentTarget.style.background = 'white'
        }}
        title={procedure.descripcion}
      >
        <span style={{
          ...styles.colorDot,
          backgroundColor: isSelected ? 'white' : procedure.color,
        }} />
        {procedure.nombre}
      </button>
    )
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Herramientas</h2>
        <p style={styles.subtitle}>
          {selectedTooth
            ? `Diente ${String(selectedTooth).split('').join('.')} seleccionado`
            : 'Seleccione un procedimiento'
          }
        </p>
      </div>

      {/* Active tool indicator */}
      {selectedTool && (
        <div style={{ padding: '8px 12px 0' }}>
          <div style={styles.activeToolBar}>
            <div>
              <p style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>Activo</p>
              <p style={{ fontSize: '13px', fontWeight: '600' }}>{selectedTool.nombre}</p>
            </div>
            <button
              onClick={() => onSelectTool(null)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                borderRadius: '6px',
                padding: '6px',
                cursor: 'pointer',
                color: '#94a3b8',
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Eraser */}
      <div style={styles.eraserArea}>
        <div style={{ paddingTop: '8px', display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onSelectTool(selectedTool?.id === 'borrador' ? null : {
              id: 'borrador',
              nombre: 'Borrador',
              descripcion: 'Eliminar marcado de superficie o diente',
              color: null,
              esHerramienta: true,
            })}
            style={{
              flex: 1,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              background: selectedTool?.id === 'borrador'
                ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
              color: selectedTool?.id === 'borrador' ? 'white' : '#64748b',
              boxShadow: selectedTool?.id === 'borrador'
                ? '0 4px 12px rgba(220, 38, 38, 0.3)'
                : 'none',
            }}
          >
            <Eraser size={16} />
            <span>Borrador</span>
          </button>

          {showCureTool && (
            <button
              onClick={() => onSelectTool(selectedTool?.id === 'curar' ? null : {
                id: 'curar',
                nombre: 'Curar / Restaurar',
                descripcion: 'Reemplazar hallazgo patológico por tratamiento',
                color: null,
                esHerramienta: true,
              })}
              style={{
                flex: 1,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                background: selectedTool?.id === 'curar'
                  ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                  : 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                color: selectedTool?.id === 'curar' ? 'white' : '#059669',
                boxShadow: selectedTool?.id === 'curar'
                  ? '0 4px 12px rgba(5, 150, 105, 0.3)'
                  : 'none',
              }}
            >
              <div style={{
                background: selectedTool?.id === 'curar' ? 'rgba(255,255,255,0.2)' : 'white',
                borderRadius: '50%',
                padding: '2px'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span>Curar</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Access Buttons */}
      <div style={styles.quickAccessArea}>
        <p style={styles.quickAccessLabel}>Acceso Rápido</p>
        <div style={styles.quickGrid}>
          {QUICK_ACCESS.map(renderQuickButton)}
        </div>
      </div>

      {/* Search Bar */}
      <div style={styles.searchArea} ref={searchRef}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={styles.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar hallazgo..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setIsSearchOpen(true)
            }}
            onFocus={() => setIsSearchOpen(true)}
            style={{
              ...styles.searchInput,
              borderColor: isSearchOpen && searchQuery ? '#3b82f6' : '#e2e8f0',
              background: isSearchOpen ? 'white' : '#f8fafc',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setIsSearchOpen(false) }}
              style={{
                position: 'absolute',
                right: '10px',
                top: '8px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8',
                padding: '2px',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isSearchOpen && searchQuery.trim() && (
          <div style={styles.dropdown}>
            {filteredProcedures.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                No se encontraron resultados
              </div>
            ) : (
              filteredProcedures.map((proc) => (
                <button
                  key={proc.id}
                  onClick={() => handleSelectFromSearch(proc)}
                  style={{
                    ...styles.dropdownItem,
                    background: selectedTool?.id === proc.id ? '#f0f9ff' : 'transparent',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = selectedTool?.id === proc.id ? '#f0f9ff' : 'transparent'}
                >
                  <span style={{
                    ...styles.colorDot,
                    backgroundColor: proc.color || '#94a3b8',
                  }} />
                  <span style={{ flex: 1 }}>{proc.nombre}</span>
                  {proc.sigla && (
                    <span style={{
                      ...styles.sigla,
                      background: '#f1f5f9',
                      color: proc.color || '#334155',
                    }}>
                      {proc.sigla}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <span style={{ ...styles.colorDot, backgroundColor: COLORS.ROJO }} />
          <span>Patológico</span>
        </div>
        <div style={styles.legendItem}>
          <span style={{ ...styles.colorDot, backgroundColor: COLORS.AZUL }} />
          <span>Buen estado</span>
        </div>
      </div>
    </div>
  )
}
