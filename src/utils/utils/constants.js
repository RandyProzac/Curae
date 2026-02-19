// Colores oficiales segun Norma Tecnica del Odontograma
// Colegio Odontologico del Peru
export const COLORS = {
  // Solo 2 colores permitidos por la norma
  ROJO: '#FF0000',      // Hallazgos patologicos, tratamientos temporales/mal estado
  AZUL: '#0000FF',      // Tratamientos definitivos en buen estado, hallazgos anatomicos
  NEGRO: '#000000',     // Estructura del grafico (lineas, contornos)

  // Colores UI (no aparecen en el odontograma impreso)
  SELECCION: '#fbbf24', // Amarillo para seleccion
  HOVER: '#e5e7eb',     // Gris claro para hover
}

// Superficies dentales
export const SUPERFICIES = {
  OCLUSAL: 'oclusal',       // O - Centro (para molares/premolares)
  INCISAL: 'incisal',       // I - Borde (para incisivos/caninos)
  MESIAL: 'mesial',         // M - Hacia la linea media
  DISTAL: 'distal',         // D - Alejado de la linea media
  VESTIBULAR: 'vestibular', // V - Hacia los labios/mejillas
  PALATINO: 'palatino',     // P - Hacia el paladar (superiores)
  LINGUAL: 'lingual',       // L - Hacia la lengua (inferiores)
}

// Sistema de numeracion FDI
export const CUADRANTES = {
  SUPERIOR_DERECHO: 1,      // Cuadrante 1 (permanentes) / 5 (temporales)
  SUPERIOR_IZQUIERDO: 2,    // Cuadrante 2 (permanentes) / 6 (temporales)
  INFERIOR_IZQUIERDO: 3,    // Cuadrante 3 (permanentes) / 7 (temporales)
  INFERIOR_DERECHO: 4,      // Cuadrante 4 (permanentes) / 8 (temporales)
}

// Tipos de dientes
export const TIPOS_DIENTE = {
  INCISIVO_CENTRAL: 'incisivo_central',
  INCISIVO_LATERAL: 'incisivo_lateral',
  CANINO: 'canino',
  PRIMER_PREMOLAR: 'primer_premolar',
  SEGUNDO_PREMOLAR: 'segundo_premolar',
  PRIMER_MOLAR: 'primer_molar',
  SEGUNDO_MOLAR: 'segundo_molar',
  TERCER_MOLAR: 'tercer_molar',
  // Temporales
  INCISIVO_CENTRAL_TEMPORAL: 'incisivo_central_temporal',
  INCISIVO_LATERAL_TEMPORAL: 'incisivo_lateral_temporal',
  CANINO_TEMPORAL: 'canino_temporal',
  PRIMER_MOLAR_TEMPORAL: 'primer_molar_temporal',
  SEGUNDO_MOLAR_TEMPORAL: 'segundo_molar_temporal',
}

// Estados de tratamiento
export const ESTADO_TRATAMIENTO = {
  BUEN_ESTADO: 'bueno',     // Color azul
  MAL_ESTADO: 'malo',       // Color rojo
  TEMPORAL: 'temporal',     // Color rojo
}

// Categorias de procedimientos
export const CATEGORIAS = {
  HALLAZGOS: 'hallazgos',
  RESTAURACIONES: 'restauraciones',
  CORONAS: 'coronas',
  TRATAMIENTO_PULPAR: 'tratamiento_pulpar',
  PROTESIS: 'protesis',
  ORTODONCIA: 'ortodoncia',
  ANOMALIAS: 'anomalias',
  OTROS: 'otros',
}

// Tipo de aplicacion del procedimiento
export const TIPO_APLICACION = {
  SUPERFICIE: 'superficie',           // Se aplica a superficies especificas
  DIENTE_COMPLETO: 'diente_completo', // Se aplica al diente entero
  CORONA: 'corona',                   // Se aplica a la corona del diente
  RAIZ: 'raiz',                       // Se aplica a la raiz
  RECUADRO: 'recuadro',               // Se registra en recuadro con sigla
  ENTRE_DIENTES: 'entre_dientes',     // Se aplica entre dos dientes
  RANGO_DIENTES: 'rango_dientes',     // Se aplica a un rango de dientes
}

// Key para localStorage
export const STORAGE_KEY = 'odontograma_data'
