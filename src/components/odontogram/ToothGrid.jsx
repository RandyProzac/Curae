import ToothSVG from './ToothSVG'
import {
  DIENTES_PERMANENTES_SUPERIORES,
  DIENTES_PERMANENTES_INFERIORES,
  DIENTES_TEMPORALES_SUPERIORES,
  DIENTES_TEMPORALES_INFERIORES,
} from '../../data/teethData'

/**
 * Grid de dientes según el layout oficial del Odontograma
 * Norma Técnica del Colegio Odontológico del Perú
 * Layout: Horizontal con 4 cuadrantes divididos por línea central
 */

export default function ToothGrid({
  data,
  selectedTool,
  onToothClick,
  onSurfaceClick,
  selectedTooth,
}) {
  // Renderizar fila de dientes con números alineados
  // Para dientes superiores: raíces arriba, números abajo (invertir SVG)
  // Para dientes inferiores: raíces abajo, números abajo (normal)
  const renderTeethRow = (teeth, esInferior = false) => {
    return teeth.map((tooth) => (
      <div
        key={tooth.numero}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: tooth.esTemporal ? '42px' : '50px',
        }}
      >
        {/* SVG del diente - Invertido para superiores */}
        <div style={{
          transform: esInferior ? 'none' : 'scaleY(-1)',
          display: 'flex',
          justifyContent: 'center',
        }}>
          <ToothSVG
            numero={tooth.numero}
            tipo={tooth.tipo}
            raices={tooth.raices}
            esMolar={tooth.esMolar}
            esTemporal={tooth.esTemporal}
            esInferior={esInferior}
            isSelected={selectedTooth === tooth.numero}
            data={data?.dientes?.[tooth.numero]}
            selectedTool={selectedTool}
            onToothClick={onToothClick}
            onSurfaceClick={onSurfaceClick}
          />
        </div>

        {/* Número del diente - siempre abajo, con formato X.X */}
        <span style={{
          fontSize: '13px',
          fontWeight: '600',
          color: '#0f766e',
          marginTop: '4px',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}>
          {String(tooth.numero).split('').join('.')}
        </span>
      </div>
    ))
  }

  const styles = {
    container: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
    },
    row: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-end',
    },
    rowInferior: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    quadrant: {
      display: 'flex',
      gap: '2px',
    },
    dividerVertical: {
      width: '2px',
      backgroundColor: '#94a3b8',
      margin: '0 8px',
      borderRadius: '1px',
    },
    dividerHorizontal: {
      width: '100%',
      maxWidth: '800px',
      height: '2px',
      background: 'linear-gradient(90deg, transparent 10%, #cbd5e1 50%, transparent 90%)',
      margin: '12px 0',
    },
    temporalSpacer: {
      width: '156px', // Space for 3 permanent molars
    },
  }

  return (
    <div style={styles.container}>
      {/* SUPERIORES PERMANENTES: 18-11 | 21-28 */}
      <div style={styles.row}>
        <div style={styles.quadrant}>
          {renderTeethRow(DIENTES_PERMANENTES_SUPERIORES.slice(0, 8), false)}
        </div>
        <div style={{ ...styles.dividerVertical, height: '90px' }} />
        <div style={styles.quadrant}>
          {renderTeethRow(DIENTES_PERMANENTES_SUPERIORES.slice(8, 16), false)}
        </div>
      </div>

      {/* SUPERIORES TEMPORALES: 55-51 | 61-65 */}
      <div style={styles.row}>
        <div style={styles.temporalSpacer} />
        <div style={styles.quadrant}>
          {renderTeethRow(DIENTES_TEMPORALES_SUPERIORES.slice(0, 5), false)}
        </div>
        <div style={{ ...styles.dividerVertical, height: '70px' }} />
        <div style={styles.quadrant}>
          {renderTeethRow(DIENTES_TEMPORALES_SUPERIORES.slice(5, 10), false)}
        </div>
        <div style={styles.temporalSpacer} />
      </div>

      {/* LÍNEA DIVISORIA (Plano Oclusal) */}
      <div style={styles.dividerHorizontal} />

      {/* INFERIORES TEMPORALES: 85-81 | 71-75 */}
      <div style={styles.rowInferior}>
        <div style={styles.temporalSpacer} />
        <div style={styles.quadrant}>
          {renderTeethRow(DIENTES_TEMPORALES_INFERIORES.slice(0, 5), true)}
        </div>
        <div style={{ ...styles.dividerVertical, height: '70px' }} />
        <div style={styles.quadrant}>
          {renderTeethRow(DIENTES_TEMPORALES_INFERIORES.slice(5, 10), true)}
        </div>
        <div style={styles.temporalSpacer} />
      </div>

      {/* INFERIORES PERMANENTES: 48-41 | 31-38 */}
      <div style={styles.rowInferior}>
        <div style={styles.quadrant}>
          {renderTeethRow(DIENTES_PERMANENTES_INFERIORES.slice(0, 8), true)}
        </div>
        <div style={{ ...styles.dividerVertical, height: '90px' }} />
        <div style={styles.quadrant}>
          {renderTeethRow(DIENTES_PERMANENTES_INFERIORES.slice(8, 16), true)}
        </div>
      </div>
    </div>
  )
}
