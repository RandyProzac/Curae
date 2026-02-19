// Status Configuration
export const APPOINTMENT_STATUS = {
  pending: {
    value: 'pending',
    label: 'Pendiente',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    icon: '⏳',
    description: 'Cita programada, esperando confirmación'
  },
  confirmed: {
    value: 'confirmed',
    label: 'Confirmado',
    color: '#10b981',
    bgColor: '#d1fae5',
    icon: '✓',
    description: 'Cita confirmada por el paciente'
  },
  attended: {
    value: 'attended',
    label: 'Atendido',
    color: '#3b82f6',
    bgColor: '#dbeafe',
    icon: '✓✓',
    description: 'Paciente atendido exitosamente'
  },
  cancelled: {
    value: 'cancelled',
    label: 'Cancelado',
    color: '#ef4444',
    bgColor: '#fee2e2',
    icon: '⊗',
    description: 'Cita cancelada'
  }
};

// Service Types
export const SERVICE_TYPES = [
  { id: 1, name: 'Consulta General', duration: 30 },
  { id: 2, name: 'Limpieza Dental', duration: 45 },
  { id: 3, name: 'Ortodoncia', duration: 60 },
  { id: 4, name: 'Endodoncia', duration: 90 },
  { id: 5, name: 'Extracción', duration: 30 },
  { id: 6, name: 'Implante', duration: 120 }
];

// Frequency Options
export const FREQUENCY_OPTIONS = [
  'No se repite',
  'Cada semana',
  'Cada 2 semanas',
  'Cada mes',
  'Cada 3 meses',
  'Cada 6 meses'
];

// Helper function to get status config
export const getStatusConfig = (status) => {
  return APPOINTMENT_STATUS[status] || APPOINTMENT_STATUS.pending;
};

// ========================================
// ODONTOGRAM CONSTANTS
// ========================================

// Colores oficiales segun Norma Tecnica del Odontograma
export const COLORS = {
  ROJO: '#FF0000',
  AZUL: '#0000FF',
  NEGRO: '#000000',
  AMARILLO: '#FFD700',
  SELECCION: '#fbbf24',
  HOVER: '#e5e7eb',
};

// Superficies dentales
export const SUPERFICIES = {
  OCLUSAL: 'oclusal',
  INCISAL: 'incisal',
  MESIAL: 'mesial',
  DISTAL: 'distal',
  VESTIBULAR: 'vestibular',
  PALATINO: 'palatino',
  LINGUAL: 'lingual',
};

// Sistema de numeracion FDI
export const CUADRANTES = {
  SUPERIOR_DERECHO: 1,
  SUPERIOR_IZQUIERDO: 2,
  INFERIOR_IZQUIERDO: 3,
  INFERIOR_DERECHO: 4,
};

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
  INCISIVO_CENTRAL_TEMPORAL: 'incisivo_central_temporal',
  INCISIVO_LATERAL_TEMPORAL: 'incisivo_lateral_temporal',
  CANINO_TEMPORAL: 'canino_temporal',
  PRIMER_MOLAR_TEMPORAL: 'primer_molar_temporal',
  SEGUNDO_MOLAR_TEMPORAL: 'segundo_molar_temporal',
};

// Estados de tratamiento
export const ESTADO_TRATAMIENTO = {
  BUEN_ESTADO: 'bueno',
  MAL_ESTADO: 'malo',
  TEMPORAL: 'temporal',
};

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
};

// Tipo de aplicacion del procedimiento
export const TIPO_APLICACION = {
  SUPERFICIE: 'superficie',
  DIENTE_COMPLETO: 'diente_completo',
  CORONA: 'corona',
  RAIZ: 'raiz',
  RECUADRO: 'recuadro',
  ENTRE_DIENTES: 'entre_dientes',
  RANGO_DIENTES: 'rango_dientes',
};

// Key para localStorage
export const STORAGE_KEY = 'odontograma_data';
