import { COLORS } from '../../utils/constants'
import {
  DIENTES_PERMANENTES_SUPERIORES,
  DIENTES_PERMANENTES_INFERIORES,
} from '../../data/teethData'

// Recuadros de anotaciones para siglas segun norma tecnica
// 3 filas x 16 columnas para cada arcada
// Fila 1: Siglas de restauraciones y coronas
// Fila 2: Tratamiento pulpar
// Fila 3: Otras anotaciones (anomalias, implantes, etc.)

export default function AnnotationBoxes({
  data,
  position = 'superior', // 'superior' o 'inferior'
  filas = 3,
}) {
  // Obtener dientes segun posicion
  const dientes = position === 'superior'
    ? DIENTES_PERMANENTES_SUPERIORES
    : DIENTES_PERMANENTES_INFERIORES

  // Obtener la sigla de un diente para una fila especifica
  const getSigla = (numeroDiente, fila) => {
    const dienteData = data?.dientes?.[numeroDiente]
    if (!dienteData) return ''

    // FILA 1: Siglas de restauraciones y coronas
    if (fila === 0) {
      // Primero verificar si hay corona
      if (dienteData.corona?.sigla) {
        return dienteData.corona.sigla
      }
      // Luego buscar sigla de restauracion en superficies
      const superficies = dienteData.superficies || {}
      for (const key of Object.keys(superficies)) {
        const superficie = superficies[key]
        if (superficie?.sigla) {
          return superficie.sigla
        }
      }
    }

    // FILA 2: Tratamiento pulpar (TC, PC, PP)
    if (fila === 1) {
      if (dienteData.raiz?.sigla) {
        return dienteData.raiz.sigla
      }
      if (dienteData.raiz?.tratamiento) {
        return dienteData.raiz.tratamiento
      }
    }

    // FILA 3: Otras anotaciones (E, I, SI, MAC, MIC, DIS, DES, M1, M2, M3, IMP)
    if (fila === 2) {
      if (dienteData.anotacion) {
        return dienteData.anotacion
      }
    }

    return ''
  }

  // Obtener el color de la sigla
  const getSiglaColor = (numeroDiente, fila) => {
    const dienteData = data?.dientes?.[numeroDiente]
    if (!dienteData) return COLORS.AZUL

    // FILA 1: Color de coronas y restauraciones
    if (fila === 0) {
      // Corona temporal o en mal estado = rojo
      if (dienteData.corona?.estado === 'temporal' || dienteData.corona?.estado === 'malo') {
        return COLORS.ROJO
      }
      // Restauracion temporal (sin relleno) = rojo
      const superficies = dienteData.superficies || {}
      for (const key of Object.keys(superficies)) {
        const superficie = superficies[key]
        if (superficie?.sigla && superficie?.relleno === false) {
          return COLORS.ROJO
        }
      }
      return COLORS.AZUL
    }

    // FILA 2: Tratamiento pulpar - siempre azul
    if (fila === 1) {
      return COLORS.AZUL
    }

    // FILA 3: Otras anotaciones - siempre azul
    return COLORS.AZUL
  }

  return (
    <div className={`annotation-boxes ${position}`}>
      {/* Renderizar las filas de recuadros */}
      {Array.from({ length: filas }).map((_, filaIndex) => (
        <div
          key={filaIndex}
          className="flex justify-center"
        >
          {/* Cuadrante derecho */}
          <div className="flex border-r-2 border-slate-400">
            {dientes.slice(0, 8).map((diente) => {
              const sigla = getSigla(diente.numero, filaIndex)
              const color = getSiglaColor(diente.numero, filaIndex)
              return (
                <div
                  key={`${diente.numero}-${filaIndex}`}
                  className="h-5 border border-slate-300 text-[10px] font-mono font-bold flex items-center justify-center bg-white"
                  style={{
                    width: '48px',
                    color: sigla ? color : 'transparent',
                    minWidth: '48px',
                  }}
                  title={sigla ? `Diente ${diente.numero}: ${sigla}` : `Diente ${diente.numero}`}
                >
                  {sigla || '\u00A0'}
                </div>
              )
            })}
          </div>
          {/* Cuadrante izquierdo */}
          <div className="flex">
            {dientes.slice(8, 16).map((diente) => {
              const sigla = getSigla(diente.numero, filaIndex)
              const color = getSiglaColor(diente.numero, filaIndex)
              return (
                <div
                  key={`${diente.numero}-${filaIndex}`}
                  className="h-5 border border-slate-300 text-[10px] font-mono font-bold flex items-center justify-center bg-white"
                  style={{
                    width: '48px',
                    color: sigla ? color : 'transparent',
                    minWidth: '48px',
                  }}
                  title={sigla ? `Diente ${diente.numero}: ${sigla}` : `Diente ${diente.numero}`}
                >
                  {sigla || '\u00A0'}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
