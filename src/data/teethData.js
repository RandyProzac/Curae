import { TIPOS_DIENTE, CUADRANTES } from '../utils/constants'

// Datos de dientes permanentes segun Sistema FDI
// Cuadrante 1: Superior Derecho (18-11)
// Cuadrante 2: Superior Izquierdo (21-28)
// Cuadrante 3: Inferior Izquierdo (31-38)
// Cuadrante 4: Inferior Derecho (48-41)

export const DIENTES_PERMANENTES_SUPERIORES = [
  // Cuadrante 1 - Superior Derecho (de derecha a izquierda en la boca del paciente)
  { numero: 18, tipo: TIPOS_DIENTE.TERCER_MOLAR, cuadrante: CUADRANTES.SUPERIOR_DERECHO, raices: 3, esMolar: true },
  { numero: 17, tipo: TIPOS_DIENTE.SEGUNDO_MOLAR, cuadrante: CUADRANTES.SUPERIOR_DERECHO, raices: 3, esMolar: true },
  { numero: 16, tipo: TIPOS_DIENTE.PRIMER_MOLAR, cuadrante: CUADRANTES.SUPERIOR_DERECHO, raices: 3, esMolar: true },
  { numero: 15, tipo: TIPOS_DIENTE.SEGUNDO_PREMOLAR, cuadrante: CUADRANTES.SUPERIOR_DERECHO, raices: 1, esMolar: false },
  { numero: 14, tipo: TIPOS_DIENTE.PRIMER_PREMOLAR, cuadrante: CUADRANTES.SUPERIOR_DERECHO, raices: 2, esMolar: false },
  { numero: 13, tipo: TIPOS_DIENTE.CANINO, cuadrante: CUADRANTES.SUPERIOR_DERECHO, raices: 1, esMolar: false },
  { numero: 12, tipo: TIPOS_DIENTE.INCISIVO_LATERAL, cuadrante: CUADRANTES.SUPERIOR_DERECHO, raices: 1, esMolar: false },
  { numero: 11, tipo: TIPOS_DIENTE.INCISIVO_CENTRAL, cuadrante: CUADRANTES.SUPERIOR_DERECHO, raices: 1, esMolar: false },
  // Cuadrante 2 - Superior Izquierdo (de linea media hacia la izquierda)
  { numero: 21, tipo: TIPOS_DIENTE.INCISIVO_CENTRAL, cuadrante: CUADRANTES.SUPERIOR_IZQUIERDO, raices: 1, esMolar: false },
  { numero: 22, tipo: TIPOS_DIENTE.INCISIVO_LATERAL, cuadrante: CUADRANTES.SUPERIOR_IZQUIERDO, raices: 1, esMolar: false },
  { numero: 23, tipo: TIPOS_DIENTE.CANINO, cuadrante: CUADRANTES.SUPERIOR_IZQUIERDO, raices: 1, esMolar: false },
  { numero: 24, tipo: TIPOS_DIENTE.PRIMER_PREMOLAR, cuadrante: CUADRANTES.SUPERIOR_IZQUIERDO, raices: 2, esMolar: false },
  { numero: 25, tipo: TIPOS_DIENTE.SEGUNDO_PREMOLAR, cuadrante: CUADRANTES.SUPERIOR_IZQUIERDO, raices: 1, esMolar: false },
  { numero: 26, tipo: TIPOS_DIENTE.PRIMER_MOLAR, cuadrante: CUADRANTES.SUPERIOR_IZQUIERDO, raices: 3, esMolar: true },
  { numero: 27, tipo: TIPOS_DIENTE.SEGUNDO_MOLAR, cuadrante: CUADRANTES.SUPERIOR_IZQUIERDO, raices: 3, esMolar: true },
  { numero: 28, tipo: TIPOS_DIENTE.TERCER_MOLAR, cuadrante: CUADRANTES.SUPERIOR_IZQUIERDO, raices: 3, esMolar: true },
]

export const DIENTES_PERMANENTES_INFERIORES = [
  // Cuadrante 4 - Inferior Derecho (de derecha a linea media)
  { numero: 48, tipo: TIPOS_DIENTE.TERCER_MOLAR, cuadrante: CUADRANTES.INFERIOR_DERECHO, raices: 2, esMolar: true },
  { numero: 47, tipo: TIPOS_DIENTE.SEGUNDO_MOLAR, cuadrante: CUADRANTES.INFERIOR_DERECHO, raices: 2, esMolar: true },
  { numero: 46, tipo: TIPOS_DIENTE.PRIMER_MOLAR, cuadrante: CUADRANTES.INFERIOR_DERECHO, raices: 2, esMolar: true },
  { numero: 45, tipo: TIPOS_DIENTE.SEGUNDO_PREMOLAR, cuadrante: CUADRANTES.INFERIOR_DERECHO, raices: 1, esMolar: false },
  { numero: 44, tipo: TIPOS_DIENTE.PRIMER_PREMOLAR, cuadrante: CUADRANTES.INFERIOR_DERECHO, raices: 1, esMolar: false },
  { numero: 43, tipo: TIPOS_DIENTE.CANINO, cuadrante: CUADRANTES.INFERIOR_DERECHO, raices: 1, esMolar: false },
  { numero: 42, tipo: TIPOS_DIENTE.INCISIVO_LATERAL, cuadrante: CUADRANTES.INFERIOR_DERECHO, raices: 1, esMolar: false },
  { numero: 41, tipo: TIPOS_DIENTE.INCISIVO_CENTRAL, cuadrante: CUADRANTES.INFERIOR_DERECHO, raices: 1, esMolar: false },
  // Cuadrante 3 - Inferior Izquierdo (de linea media hacia la izquierda)
  { numero: 31, tipo: TIPOS_DIENTE.INCISIVO_CENTRAL, cuadrante: CUADRANTES.INFERIOR_IZQUIERDO, raices: 1, esMolar: false },
  { numero: 32, tipo: TIPOS_DIENTE.INCISIVO_LATERAL, cuadrante: CUADRANTES.INFERIOR_IZQUIERDO, raices: 1, esMolar: false },
  { numero: 33, tipo: TIPOS_DIENTE.CANINO, cuadrante: CUADRANTES.INFERIOR_IZQUIERDO, raices: 1, esMolar: false },
  { numero: 34, tipo: TIPOS_DIENTE.PRIMER_PREMOLAR, cuadrante: CUADRANTES.INFERIOR_IZQUIERDO, raices: 1, esMolar: false },
  { numero: 35, tipo: TIPOS_DIENTE.SEGUNDO_PREMOLAR, cuadrante: CUADRANTES.INFERIOR_IZQUIERDO, raices: 1, esMolar: false },
  { numero: 36, tipo: TIPOS_DIENTE.PRIMER_MOLAR, cuadrante: CUADRANTES.INFERIOR_IZQUIERDO, raices: 2, esMolar: true },
  { numero: 37, tipo: TIPOS_DIENTE.SEGUNDO_MOLAR, cuadrante: CUADRANTES.INFERIOR_IZQUIERDO, raices: 2, esMolar: true },
  { numero: 38, tipo: TIPOS_DIENTE.TERCER_MOLAR, cuadrante: CUADRANTES.INFERIOR_IZQUIERDO, raices: 2, esMolar: true },
]

// Dientes temporales (denticion decidua)
// Cuadrante 5: Superior Derecho (55-51)
// Cuadrante 6: Superior Izquierdo (61-65)
// Cuadrante 7: Inferior Izquierdo (71-75)
// Cuadrante 8: Inferior Derecho (85-81)

export const DIENTES_TEMPORALES_SUPERIORES = [
  // Cuadrante 5 - Superior Derecho
  { numero: 55, tipo: TIPOS_DIENTE.SEGUNDO_MOLAR_TEMPORAL, cuadrante: 5, raices: 3, esMolar: true, esTemporal: true },
  { numero: 54, tipo: TIPOS_DIENTE.PRIMER_MOLAR_TEMPORAL, cuadrante: 5, raices: 3, esMolar: true, esTemporal: true },
  { numero: 53, tipo: TIPOS_DIENTE.CANINO_TEMPORAL, cuadrante: 5, raices: 1, esMolar: false, esTemporal: true },
  { numero: 52, tipo: TIPOS_DIENTE.INCISIVO_LATERAL_TEMPORAL, cuadrante: 5, raices: 1, esMolar: false, esTemporal: true },
  { numero: 51, tipo: TIPOS_DIENTE.INCISIVO_CENTRAL_TEMPORAL, cuadrante: 5, raices: 1, esMolar: false, esTemporal: true },
  // Cuadrante 6 - Superior Izquierdo
  { numero: 61, tipo: TIPOS_DIENTE.INCISIVO_CENTRAL_TEMPORAL, cuadrante: 6, raices: 1, esMolar: false, esTemporal: true },
  { numero: 62, tipo: TIPOS_DIENTE.INCISIVO_LATERAL_TEMPORAL, cuadrante: 6, raices: 1, esMolar: false, esTemporal: true },
  { numero: 63, tipo: TIPOS_DIENTE.CANINO_TEMPORAL, cuadrante: 6, raices: 1, esMolar: false, esTemporal: true },
  { numero: 64, tipo: TIPOS_DIENTE.PRIMER_MOLAR_TEMPORAL, cuadrante: 6, raices: 3, esMolar: true, esTemporal: true },
  { numero: 65, tipo: TIPOS_DIENTE.SEGUNDO_MOLAR_TEMPORAL, cuadrante: 6, raices: 3, esMolar: true, esTemporal: true },
]

export const DIENTES_TEMPORALES_INFERIORES = [
  // Cuadrante 8 - Inferior Derecho
  { numero: 85, tipo: TIPOS_DIENTE.SEGUNDO_MOLAR_TEMPORAL, cuadrante: 8, raices: 2, esMolar: true, esTemporal: true },
  { numero: 84, tipo: TIPOS_DIENTE.PRIMER_MOLAR_TEMPORAL, cuadrante: 8, raices: 2, esMolar: true, esTemporal: true },
  { numero: 83, tipo: TIPOS_DIENTE.CANINO_TEMPORAL, cuadrante: 8, raices: 1, esMolar: false, esTemporal: true },
  { numero: 82, tipo: TIPOS_DIENTE.INCISIVO_LATERAL_TEMPORAL, cuadrante: 8, raices: 1, esMolar: false, esTemporal: true },
  { numero: 81, tipo: TIPOS_DIENTE.INCISIVO_CENTRAL_TEMPORAL, cuadrante: 8, raices: 1, esMolar: false, esTemporal: true },
  // Cuadrante 7 - Inferior Izquierdo
  { numero: 71, tipo: TIPOS_DIENTE.INCISIVO_CENTRAL_TEMPORAL, cuadrante: 7, raices: 1, esMolar: false, esTemporal: true },
  { numero: 72, tipo: TIPOS_DIENTE.INCISIVO_LATERAL_TEMPORAL, cuadrante: 7, raices: 1, esMolar: false, esTemporal: true },
  { numero: 73, tipo: TIPOS_DIENTE.CANINO_TEMPORAL, cuadrante: 7, raices: 1, esMolar: false, esTemporal: true },
  { numero: 74, tipo: TIPOS_DIENTE.PRIMER_MOLAR_TEMPORAL, cuadrante: 7, raices: 2, esMolar: true, esTemporal: true },
  { numero: 75, tipo: TIPOS_DIENTE.SEGUNDO_MOLAR_TEMPORAL, cuadrante: 7, raices: 2, esMolar: true, esTemporal: true },
]

// Todos los dientes permanentes
export const TODOS_DIENTES_PERMANENTES = [
  ...DIENTES_PERMANENTES_SUPERIORES,
  ...DIENTES_PERMANENTES_INFERIORES,
]

// Todos los dientes temporales
export const TODOS_DIENTES_TEMPORALES = [
  ...DIENTES_TEMPORALES_SUPERIORES,
  ...DIENTES_TEMPORALES_INFERIORES,
]

// Funcion helper para obtener datos de un diente por numero
export function getDienteData(numero) {
  return [...TODOS_DIENTES_PERMANENTES, ...TODOS_DIENTES_TEMPORALES].find(
    d => d.numero === numero
  )
}

// Funcion helper para determinar si un diente es anterior (incisivos y caninos)
export function esAnterior(numero) {
  const diente = getDienteData(numero)
  if (!diente) return false
  return [
    TIPOS_DIENTE.INCISIVO_CENTRAL,
    TIPOS_DIENTE.INCISIVO_LATERAL,
    TIPOS_DIENTE.CANINO,
    TIPOS_DIENTE.INCISIVO_CENTRAL_TEMPORAL,
    TIPOS_DIENTE.INCISIVO_LATERAL_TEMPORAL,
    TIPOS_DIENTE.CANINO_TEMPORAL,
  ].includes(diente.tipo)
}

// Funcion helper para determinar si un diente es superior
export function esSuperior(numero) {
  const diente = getDienteData(numero)
  if (!diente) return false
  return [1, 2, 5, 6].includes(diente.cuadrante)
}
