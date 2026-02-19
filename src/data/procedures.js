import { COLORS, CATEGORIAS, TIPO_APLICACION, ESTADO_TRATAMIENTO } from '../utils/constants'

// Catalogo completo de procedimientos segun Norma Tecnica del Odontograma
// Colegio Odontologico del Peru (COP)
// Cada hallazgo tiene dos variantes de color:
//   AZUL = buen estado / definitivo / tratamiento realizado
//   ROJO = mal estado / patologico / temporal / por tratar

export const PROCEDIMIENTOS = {
  // ============================================
  // HERRAMIENTAS ESPECIALES
  // ============================================
  BORRADOR: {
    id: 'borrador',
    nombre: 'Borrador',
    sigla: null,
    color: null,
    categoria: 'herramientas',
    tipoAplicacion: TIPO_APLICACION.SUPERFICIE,
    descripcion: 'Eliminar marcado de superficie o diente',
    relleno: false,
    esHerramienta: true,
  },

  // ============================================
  // HALLAZGOS PATOLOGICOS (Rojo)
  // ============================================
  CARIES: {
    id: 'caries',
    nombre: 'Caries',
    sigla: null,
    color: COLORS.ROJO,
    categoria: CATEGORIAS.HALLAZGOS,
    tipoAplicacion: TIPO_APLICACION.SUPERFICIE,
    descripcion: 'Lesion cariosa - pintar superficies comprometidas',
    relleno: true,
  },

  FRACTURA: {
    id: 'fractura',
    nombre: 'Fractura',
    sigla: null,
    color: COLORS.ROJO,
    categoria: CATEGORIAS.HALLAZGOS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Linea diagonal sobre la corona',
    relleno: false,
  },

  REMANENTE_RADICULAR: {
    id: 'remanente_radicular',
    nombre: 'Remanente Radicular',
    sigla: 'RR',
    color: COLORS.ROJO,
    categoria: CATEGORIAS.HALLAZGOS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Letras RR sobre la raiz',
    relleno: false,
  },

  FOSA_FISURAS_PROFUNDAS: {
    id: 'fosa_fisuras',
    nombre: 'Fosa y Fisuras Profundas',
    sigla: 'FFP',
    color: COLORS.ROJO,
    categoria: CATEGORIAS.HALLAZGOS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Letras FFP encima del diente',
    relleno: false,
  },

  LESION_CERVICAL: {
    id: 'lesion_cervical',
    nombre: 'Lesion Cervical',
    sigla: null,
    color: COLORS.ROJO,
    categoria: CATEGORIAS.HALLAZGOS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Muesca en V en zona cervical',
    relleno: false,
  },

  GINGIVITIS: {
    id: 'gingivitis',
    nombre: 'Gingivitis',
    sigla: null,
    color: COLORS.ROJO,
    categoria: CATEGORIAS.HALLAZGOS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Linea ondulada roja en encia',
    relleno: false,
  },

  SUPERFICIE_DESGASTADA: {
    id: 'desgaste',
    nombre: 'Superficie Desgastada',
    sigla: 'DES',
    color: COLORS.ROJO,
    categoria: CATEGORIAS.HALLAZGOS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Letras DES encima del diente',
    relleno: false,
  },

  DEFECTOS_ESMALTE: {
    id: 'defectos_esmalte',
    nombre: 'Defectos de Desarrollo de Esmalte',
    sigla: null,
    color: COLORS.AMARILLO,
    categoria: CATEGORIAS.HALLAZGOS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Circulo amarillo sobre la corona',
    relleno: true,
  },

  // ============================================
  // RESTAURACIONES (Azul = buen estado)
  // ============================================
  RESTAURACION_AMALGAMA: {
    id: 'amalgama',
    nombre: 'Amalgama',
    sigla: 'AM',
    color: COLORS.AZUL,
    categoria: CATEGORIAS.RESTAURACIONES,
    tipoAplicacion: TIPO_APLICACION.SUPERFICIE,
    descripcion: 'Restauracion de amalgama en buen estado',
    relleno: true,
  },

  RESTAURACION_RESINA: {
    id: 'resina',
    nombre: 'Resina',
    sigla: 'R',
    color: COLORS.AZUL,
    categoria: CATEGORIAS.RESTAURACIONES,
    tipoAplicacion: TIPO_APLICACION.SUPERFICIE,
    descripcion: 'Restauracion de resina en buen estado',
    relleno: true,
  },

  RESTAURACION_IONOMERO: {
    id: 'ionomero',
    nombre: 'Ionomero de Vidrio',
    sigla: 'IV',
    color: COLORS.AZUL,
    categoria: CATEGORIAS.RESTAURACIONES,
    tipoAplicacion: TIPO_APLICACION.SUPERFICIE,
    descripcion: 'Restauracion de ionomero de vidrio',
    relleno: true,
  },

  INCRUSTACION_METALICA: {
    id: 'incrustacion_metalica',
    nombre: 'Incrustacion Metalica',
    sigla: 'IM',
    color: COLORS.AZUL,
    categoria: CATEGORIAS.RESTAURACIONES,
    tipoAplicacion: TIPO_APLICACION.SUPERFICIE,
    descripcion: 'Incrustacion metalica',
    relleno: true,
  },

  INCRUSTACION_ESTETICA: {
    id: 'incrustacion_estetica',
    nombre: 'Incrustacion Estetica',
    sigla: 'IE',
    color: COLORS.AZUL,
    categoria: CATEGORIAS.RESTAURACIONES,
    tipoAplicacion: TIPO_APLICACION.SUPERFICIE,
    descripcion: 'Incrustacion estetica',
    relleno: true,
  },

  RESTAURACION_TEMPORAL: {
    id: 'restauracion_temporal',
    nombre: 'Restauracion Temporal',
    sigla: null,
    color: COLORS.ROJO,
    categoria: CATEGORIAS.RESTAURACIONES,
    tipoAplicacion: TIPO_APLICACION.SUPERFICIE,
    descripcion: 'Solo contorno de la restauracion (sin relleno)',
    relleno: false,
  },

  SELLANTES: {
    id: 'sellantes',
    nombre: 'Sellantes',
    sigla: 'S',
    color: COLORS.AZUL,
    categoria: CATEGORIAS.RESTAURACIONES,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Letra S sobre la superficie oclusal',
    relleno: false,
  },

  // ============================================
  // CORONAS
  // ============================================
  CORONA: {
    id: 'corona',
    nombre: 'Corona',
    sigla: null,
    color: COLORS.AZUL,
    categoria: CATEGORIAS.CORONAS,
    tipoAplicacion: TIPO_APLICACION.CORONA,
    descripcion: 'Cuadrado/circulo encerrando la corona del diente',
    estado: ESTADO_TRATAMIENTO.BUEN_ESTADO,
  },

  CORONA_TEMPORAL: {
    id: 'corona_temporal',
    nombre: 'Corona Temporal',
    sigla: null,
    color: COLORS.ROJO,
    categoria: CATEGORIAS.CORONAS,
    tipoAplicacion: TIPO_APLICACION.CORONA,
    descripcion: 'Cuadrado/circulo rojo encerrando la corona',
    estado: ESTADO_TRATAMIENTO.TEMPORAL,
  },

  CARILLAS: {
    id: 'carillas',
    nombre: 'Carillas',
    sigla: null,
    color: COLORS.AZUL,
    categoria: CATEGORIAS.CORONAS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Forma U rellena sobre cara vestibular',
    relleno: true,
  },

  CARILLAS_MAL_ESTADO: {
    id: 'carillas_mal',
    nombre: 'Carillas (Mal Estado)',
    sigla: null,
    color: COLORS.ROJO,
    categoria: CATEGORIAS.CORONAS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Forma U rellena roja sobre cara vestibular',
    relleno: true,
  },

  // ============================================
  // TRATAMIENTO PULPAR
  // ============================================
  ENDODONCIA: {
    id: 'endodoncia',
    nombre: 'Endodoncia',
    sigla: 'TC',
    color: COLORS.AZUL,
    categoria: CATEGORIAS.TRATAMIENTO_PULPAR,
    tipoAplicacion: TIPO_APLICACION.RAIZ,
    descripcion: 'Linea vertical en la raiz con circulo en apice',
  },

  ENDODONCIA_MAL: {
    id: 'endodoncia_mal',
    nombre: 'Endodoncia (Mal Estado)',
    sigla: 'TC',
    color: COLORS.ROJO,
    categoria: CATEGORIAS.TRATAMIENTO_PULPAR,
    tipoAplicacion: TIPO_APLICACION.RAIZ,
    descripcion: 'Linea vertical roja en la raiz',
  },

  PULPECTOMIA: {
    id: 'pulpectomia',
    nombre: 'Pulpectomia',
    sigla: 'PC',
    color: COLORS.AZUL,
    categoria: CATEGORIAS.TRATAMIENTO_PULPAR,
    tipoAplicacion: TIPO_APLICACION.RAIZ,
    descripcion: 'Linea vertical en la raiz',
  },

  PULPOTOMIA: {
    id: 'pulpotomia',
    nombre: 'Pulpotomia',
    sigla: 'PP',
    color: COLORS.AZUL,
    categoria: CATEGORIAS.TRATAMIENTO_PULPAR,
    tipoAplicacion: TIPO_APLICACION.RAIZ,
    descripcion: 'Linea vertical corta solo en camara pulpar',
  },

  // ============================================
  // PERNOS
  // ============================================
  ESPIGO_MUNON: {
    id: 'espigo_munon',
    nombre: 'Espigo-Muñon',
    sigla: null,
    color: COLORS.AZUL,
    categoria: CATEGORIAS.TRATAMIENTO_PULPAR,
    tipoAplicacion: TIPO_APLICACION.RAIZ,
    descripcion: 'Forma T invertida (linea + cuadrado en corona)',
  },

  ESPIGO_MUNON_MAL: {
    id: 'espigo_munon_mal',
    nombre: 'Espigo-Muñon (Mal Estado)',
    sigla: null,
    color: COLORS.ROJO,
    categoria: CATEGORIAS.TRATAMIENTO_PULPAR,
    tipoAplicacion: TIPO_APLICACION.RAIZ,
    descripcion: 'Forma T invertida roja',
  },

  PERNO_FIBRA: {
    id: 'perno_fibra',
    nombre: 'Perno de Fibra',
    sigla: null,
    color: COLORS.AZUL,
    categoria: CATEGORIAS.TRATAMIENTO_PULPAR,
    tipoAplicacion: TIPO_APLICACION.RAIZ,
    descripcion: 'Linea con circulo vacio en raiz',
  },

  PERNO_METALICO: {
    id: 'perno_metalico',
    nombre: 'Perno Metalico',
    sigla: null,
    color: COLORS.AZUL,
    categoria: CATEGORIAS.TRATAMIENTO_PULPAR,
    tipoAplicacion: TIPO_APLICACION.RAIZ,
    descripcion: 'Linea con cuadrado relleno en raiz',
  },

  // ============================================
  // OTROS HALLAZGOS / ESTADOS DE PIEZA
  // ============================================
  DIENTE_AUSENTE: {
    id: 'ausente',
    nombre: 'Pieza Dentaria Ausente',
    sigla: null,
    color: COLORS.AZUL,
    categoria: CATEGORIAS.OTROS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Aspa azul (X) sobre la figura del diente',
  },

  EXTRACCION: {
    id: 'extraccion',
    nombre: 'Extraccion (Indicada)',
    sigla: null,
    color: COLORS.ROJO,
    categoria: CATEGORIAS.OTROS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Aspa roja (X) sobre la figura del diente',
  },

  IMPLANTE: {
    id: 'implante',
    nombre: 'Implante Dental',
    sigla: null,
    color: COLORS.AZUL,
    categoria: CATEGORIAS.OTROS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Tornillo/rectangulo en zona de raiz',
  },

  IMPLANTE_MAL: {
    id: 'implante_mal',
    nombre: 'Implante Dental (Mal Estado)',
    sigla: null,
    color: COLORS.ROJO,
    categoria: CATEGORIAS.OTROS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Tornillo/rectangulo rojo en zona de raiz',
  },

  PIEZA_ERUPCION: {
    id: 'en_erupcion',
    nombre: 'Pieza en Erupcion',
    sigla: null,
    color: COLORS.AZUL,
    categoria: CATEGORIAS.OTROS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Flecha parcial hacia oclusal',
  },

  NO_ERUPCIONADO: {
    id: 'no_erupcionado',
    nombre: 'No Erupcionado',
    sigla: null,
    color: COLORS.AZUL,
    categoria: CATEGORIAS.OTROS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Contorno punteado del diente',
  },

  EDENTULO_TOTAL: {
    id: 'edentulo_total',
    nombre: 'Edentulo Total',
    sigla: null,
    color: COLORS.AZUL,
    categoria: CATEGORIAS.OTROS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Linea horizontal sobre la corona',
  },

  // ============================================
  // ANOMALIAS
  // ============================================
  DIASTEMA: {
    id: 'diastema',
    nombre: 'Diastema',
    sigla: null,
    color: COLORS.AZUL,
    categoria: CATEGORIAS.ANOMALIAS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Dos lineas verticales cruzadas (X) entre dientes',
  },

  EXTRUSION: {
    id: 'extrusion',
    nombre: 'Pieza Dental Extruida',
    sigla: null,
    color: COLORS.AZUL,
    categoria: CATEGORIAS.ANOMALIAS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Flecha hacia el plano oclusal',
  },

  INTRUSION: {
    id: 'intrusion',
    nombre: 'Pieza Dental Intruida',
    sigla: null,
    color: COLORS.AZUL,
    categoria: CATEGORIAS.ANOMALIAS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Flecha hacia el apice',
  },

  INTRUSION_ANQUILOSIS: {
    id: 'intrusion_anquilosis',
    nombre: 'Intruida - Anquilosis',
    sigla: null,
    color: COLORS.AZUL,
    categoria: CATEGORIAS.ANOMALIAS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Flecha hacia apice con barra horizontal',
  },

  GIROVERSION: {
    id: 'giroversion',
    nombre: 'Giroversion',
    sigla: null,
    color: COLORS.AZUL,
    categoria: CATEGORIAS.ANOMALIAS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Flecha curva a nivel oclusal',
  },

  POSICION_DENTARIA: {
    id: 'posicion_dentaria',
    nombre: 'Posicion Dentaria',
    sigla: null,
    color: COLORS.AZUL,
    categoria: CATEGORIAS.ANOMALIAS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Flecha recta horizontal a nivel oclusal',
  },

  IMPACTACION: {
    id: 'impactacion',
    nombre: 'Impactacion',
    sigla: 'I',
    color: COLORS.AZUL,
    categoria: CATEGORIAS.ANOMALIAS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Letra I encima del diente',
  },

  MACRODONCIA: {
    id: 'macrodoncia',
    nombre: 'Macrodoncia',
    sigla: 'MAC',
    color: COLORS.AZUL,
    categoria: CATEGORIAS.ANOMALIAS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Letras MAC encima del diente',
  },

  MICRODONCIA: {
    id: 'microdoncia',
    nombre: 'Microdoncia',
    sigla: 'MIC',
    color: COLORS.AZUL,
    categoria: CATEGORIAS.ANOMALIAS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Letras MIC encima del diente',
  },

  DISCROMICO: {
    id: 'discromico',
    nombre: 'Pieza Discromica',
    sigla: 'DIS',
    color: COLORS.AZUL,
    categoria: CATEGORIAS.ANOMALIAS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Letras DIS encima del diente',
  },

  MOVILIDAD_1: {
    id: 'movilidad_1',
    nombre: 'Movilidad Grado I',
    sigla: 'I',
    color: COLORS.AZUL,
    categoria: CATEGORIAS.ANOMALIAS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Grado I de movilidad patologica',
    grupoMovilidad: true,
  },

  MOVILIDAD_2: {
    id: 'movilidad_2',
    nombre: 'Movilidad Grado II',
    sigla: 'II',
    color: COLORS.AZUL,
    categoria: CATEGORIAS.ANOMALIAS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Grado II de movilidad patologica',
    grupoMovilidad: true,
  },

  MOVILIDAD_3: {
    id: 'movilidad_3',
    nombre: 'Movilidad Grado III',
    sigla: 'III',
    color: COLORS.AZUL,
    categoria: CATEGORIAS.ANOMALIAS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Grado III de movilidad patologica',
    grupoMovilidad: true,
  },

  ECTOPICO: {
    id: 'ectopico',
    nombre: 'Pieza Ectopica',
    sigla: 'E',
    color: COLORS.AZUL,
    categoria: CATEGORIAS.ANOMALIAS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Letra E encima del diente',
  },

  DIENTE_CLAVIJA: {
    id: 'diente_clavija',
    nombre: 'Diente en Clavija',
    sigla: null,
    color: COLORS.AZUL,
    categoria: CATEGORIAS.ANOMALIAS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Triangulo alrededor del numero del diente',
  },

  SUPERNUMERARIO: {
    id: 'supernumerario',
    nombre: 'Pieza Supernumeraria',
    sigla: 'S',
    color: COLORS.AZUL,
    categoria: CATEGORIAS.ANOMALIAS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Letra S en circulo entre apices',
  },

  FUSION: {
    id: 'fusion',
    nombre: 'Fusion',
    sigla: null,
    color: COLORS.AZUL,
    categoria: CATEGORIAS.ANOMALIAS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Dos circunferencias interceptadas',
  },

  GEMINACION: {
    id: 'geminacion',
    nombre: 'Geminacion',
    sigla: null,
    color: COLORS.AZUL,
    categoria: CATEGORIAS.ANOMALIAS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Dos circunferencias interceptadas (similar a fusion)',
  },

  FRENILLO_CORTO: {
    id: 'frenillo_corto',
    nombre: 'Frenillo Corto',
    sigla: null,
    color: COLORS.ROJO,
    categoria: CATEGORIAS.ANOMALIAS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'V invertida entre raices (zona de frenillo)',
  },

  // ============================================
  // PROTESIS (per-tooth, range built visually)
  // ============================================
  PROTESIS_FIJA: {
    id: 'protesis_fija',
    nombre: 'Protesis Fija',
    sigla: 'PF',
    color: COLORS.AZUL,
    categoria: CATEGORIAS.PROTESIS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Linea horizontal sobre la pieza (marcar cada pieza del puente)',
  },

  PROTESIS_FIJA_MAL: {
    id: 'protesis_fija_mal',
    nombre: 'Protesis Fija (Mal Estado)',
    sigla: 'PF',
    color: COLORS.ROJO,
    categoria: CATEGORIAS.PROTESIS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Linea horizontal roja sobre la pieza',
  },

  PROTESIS_REMOVIBLE: {
    id: 'protesis_removible',
    nombre: 'Protesis Removible',
    sigla: 'PR',
    color: COLORS.AZUL,
    categoria: CATEGORIAS.PROTESIS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Doble linea horizontal (marcar cada pieza)',
  },

  PROTESIS_REMOVIBLE_MAL: {
    id: 'protesis_removible_mal',
    nombre: 'Protesis Removible (Mal Estado)',
    sigla: 'PR',
    color: COLORS.ROJO,
    categoria: CATEGORIAS.PROTESIS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Doble linea horizontal roja',
  },

  PROTESIS_TOTAL: {
    id: 'protesis_total',
    nombre: 'Protesis Total',
    sigla: 'PT',
    color: COLORS.AZUL,
    categoria: CATEGORIAS.PROTESIS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Doble linea horizontal sobre coronas (marcar cada pieza)',
  },

  PROTESIS_TOTAL_MAL: {
    id: 'protesis_total_mal',
    nombre: 'Protesis Total (Mal Estado)',
    sigla: 'PT',
    color: COLORS.ROJO,
    categoria: CATEGORIAS.PROTESIS,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Doble linea horizontal roja sobre coronas',
  },

  // ============================================
  // ORTODONCIA (per-tooth, range built visually)
  // ============================================
  APARATO_ORTODONTICO_FIJO: {
    id: 'ortodoncia_fija',
    nombre: 'Aparato Ortodontico Fijo',
    sigla: null,
    color: COLORS.AZUL,
    categoria: CATEGORIAS.ORTODONCIA,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Cuadrado con cruz + linea horizontal (marcar cada pieza)',
  },

  APARATO_ORTODONTICO_FIJO_MAL: {
    id: 'ortodoncia_fija_mal',
    nombre: 'Aparato Ortodontico Fijo (Mal Estado)',
    sigla: null,
    color: COLORS.ROJO,
    categoria: CATEGORIAS.ORTODONCIA,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Cuadrado con cruz rojo + linea horizontal',
  },

  APARATO_ORTODONTICO_REMOVIBLE: {
    id: 'ortodoncia_removible',
    nombre: 'Aparato Ortodontico Removible',
    sigla: null,
    color: COLORS.AZUL,
    categoria: CATEGORIAS.ORTODONCIA,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Chevron/zigzag debajo de la corona (marcar cada pieza)',
  },

  APARATO_ORTODONTICO_REMOVIBLE_MAL: {
    id: 'ortodoncia_removible_mal',
    nombre: 'Aparato Ortodontico Removible (Mal Estado)',
    sigla: null,
    color: COLORS.ROJO,
    categoria: CATEGORIAS.ORTODONCIA,
    tipoAplicacion: TIPO_APLICACION.DIENTE_COMPLETO,
    descripcion: 'Chevron/zigzag rojo debajo de la corona',
  },
}

// Obtener procedimientos por categoria
export function getProcedimientosByCategoria(categoria) {
  return Object.values(PROCEDIMIENTOS).filter(p => p.categoria === categoria)
}

// Obtener un procedimiento por ID
export function getProcedimientoById(id) {
  return Object.values(PROCEDIMIENTOS).find(p => p.id === id)
}

// Lista de categorias con sus nombres para mostrar
export const CATEGORIAS_DISPLAY = [
  { id: CATEGORIAS.HALLAZGOS, nombre: 'Hallazgos Patologicos' },
  { id: CATEGORIAS.RESTAURACIONES, nombre: 'Restauraciones' },
  { id: CATEGORIAS.CORONAS, nombre: 'Coronas y Carillas' },
  { id: CATEGORIAS.TRATAMIENTO_PULPAR, nombre: 'Tratamiento Pulpar y Pernos' },
  { id: CATEGORIAS.ANOMALIAS, nombre: 'Anomalias Dentarias' },
  { id: CATEGORIAS.OTROS, nombre: 'Estado de Pieza' },
  { id: CATEGORIAS.PROTESIS, nombre: 'Protesis' },
  { id: CATEGORIAS.ORTODONCIA, nombre: 'Ortodoncia' },
]
