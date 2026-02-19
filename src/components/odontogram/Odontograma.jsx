import ToothGrid from './ToothGrid'
import SpecificationsArea from './SpecificationsArea'
import { COLORS } from '../../utils/constants'

/**
 * Componente principal del Odontograma
 * Diseño limpio y compacto - sin scroll innecesario
 */
export default function Odontograma({
  data,
  selectedTool,
  onToothClick,
  onSurfaceClick,
  onSpecificationsChange,
  selectedTooth,
  showSpecifications = true,
  showHeader = true,
}) {
  const styles = {
    container: {
      width: '100%',
      fontFamily: "'Inter', -apple-system, sans-serif",
    },
    header: {
      textAlign: 'center',
      marginBottom: '10px',
    },
    title: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#1e293b',
      letterSpacing: '1px',
      marginBottom: '4px',
    },
    subtitle: {
      fontSize: '12px',
      color: '#64748b',
    },
    gridContainer: {
      marginBottom: '4px',
    },
    legend: {
      display: 'flex',
      justifyContent: 'center',
      gap: '16px',
      paddingTop: '8px',
      borderTop: '1px solid #e2e8f0',
      marginTop: '8px',
    },
    legendItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '11px',
      color: '#475569',
    },
    legendDot: {
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
    },
  }

  return (
    <div style={styles.container}>
      {/* Encabezado compacto */}
      {showHeader && (
        <div style={styles.header}>
          <h2 style={styles.title}>ODONTOGRAMA</h2>
          <p style={styles.subtitle}>
            Sistema FDI · Norma Técnica del Colegio Odontológico del Perú
          </p>
        </div>
      )}

      {/* Grid de dientes */}
      <div style={styles.gridContainer}>
        <ToothGrid
          data={data}
          selectedTool={selectedTool}
          onToothClick={onToothClick}
          onSurfaceClick={onSurfaceClick}
          selectedTooth={selectedTooth}
        />
      </div>

      {/* Leyenda compacta */}
      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <span style={{ ...styles.legendDot, backgroundColor: COLORS.ROJO }} />
          <span>Patológico / Temporal</span>
        </div>
        <div style={styles.legendItem}>
          <span style={{ ...styles.legendDot, backgroundColor: COLORS.AZUL }} />
          <span>Definitivo / Buen estado</span>
        </div>
      </div>

      {/* Especificaciones (colapsado/opcional) */}
      {showSpecifications && (
        <div style={{ marginTop: '20px' }}>
          <SpecificationsArea
            value={data?.especificaciones || ''}
            onChange={onSpecificationsChange}
          />
        </div>
      )}
    </div>
  )
}
