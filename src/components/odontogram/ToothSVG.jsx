import { COLORS } from '../../utils/constants'
import { esAnterior } from '../../data/teethData'

/**
 * Componente SVG individual de un diente
 * Estilo vectorial limpio con bordes redondeados
 * Cumple con la Norma Técnica del Colegio Odontológico del Perú
 */

export default function ToothSVG({
  numero,
  raices = 1,
  esMolar = false,
  esTemporal = false,
  isSelected = false,
  data = {},
  selectedTool,
  onSurfaceClick,
  onToothClick,
  esInferior = false,
}) {
  const anterior = esAnterior(numero)
  const superior = !esInferior

  // Dimensiones base
  const width = esTemporal ? 38 : 46
  const crownHeight = 30
  const rootHeight = esTemporal ? 32 : 45
  const textPad = 16  // Extra space above/below for text siglas
  const bodyHeight = crownHeight + rootHeight + 12
  const totalHeight = bodyHeight + textPad

  // Obtener color de relleno para una superficie
  const getSurfaceFill = (superficie) => {
    const surfaceData = data?.superficies?.[superficie]
    if (surfaceData?.hallazgo && surfaceData?.relleno !== false) {
      return surfaceData.color || COLORS.ROJO
    }
    return 'white'
  }

  // Obtener color de borde para una superficie
  const getSurfaceStroke = (superficie) => {
    const surfaceData = data?.superficies?.[superficie]
    if (surfaceData?.hallazgo && surfaceData?.relleno === false) {
      return surfaceData.color || COLORS.ROJO
    }
    return '#334155'
  }

  const getSurfaceStrokeWidth = (superficie) => {
    const surfaceData = data?.superficies?.[superficie]
    if (surfaceData?.hallazgo && surfaceData?.relleno === false) {
      return 2
    }
    return 1.2
  }

  const cursor = selectedTool ? 'pointer' : 'default'

  // ============================
  // CORONA (5 superficies)
  // ============================
  const renderCrown = () => {
    const cx = width / 2
    const cy = crownHeight / 2 + 4
    const size = 13
    const inner = 5
    const r = 4
    const clipId = `clip-crown-${numero}`

    const innerBox = {
      top: cy - inner,
      bottom: cy + inner,
      left: cx - inner,
      right: cx + inner,
    }

    const outerBox = {
      top: cy - size,
      bottom: cy + size,
      left: cx - size,
      right: cx + size,
    }

    return (
      <g className="tooth-crown">
        <defs>
          <clipPath id={clipId}>
            <rect
              x={outerBox.left}
              y={outerBox.top}
              width={size * 2}
              height={size * 2}
              rx={r}
              ry={r}
            />
          </clipPath>
        </defs>

        <rect
          x={outerBox.left}
          y={outerBox.top}
          width={size * 2}
          height={size * 2}
          rx={r}
          ry={r}
          fill="white"
          stroke="#334155"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />

        <g clipPath={`url(#${clipId})`}>
          {/* VESTIBULAR */}
          <path
            d={`M ${outerBox.left - 1} ${outerBox.top - 1}
                L ${outerBox.right + 1} ${outerBox.top - 1}
                L ${innerBox.right} ${innerBox.top}
                L ${innerBox.left} ${innerBox.top} Z`}
            fill={getSurfaceFill('vestibular')}
            stroke={getSurfaceStroke('vestibular')}
            strokeWidth={getSurfaceStrokeWidth('vestibular')}
            strokeLinejoin="round"
            className="tooth-surface"
            onClick={(e) => {
              e.stopPropagation()
              onSurfaceClick?.(numero, 'vestibular')
            }}
            style={{ cursor }}
          />

          {/* PALATINO/LINGUAL */}
          <path
            d={`M ${outerBox.left - 1} ${outerBox.bottom + 1}
                L ${outerBox.right + 1} ${outerBox.bottom + 1}
                L ${innerBox.right} ${innerBox.bottom}
                L ${innerBox.left} ${innerBox.bottom} Z`}
            fill={getSurfaceFill('palatino')}
            stroke={getSurfaceStroke('palatino')}
            strokeWidth={getSurfaceStrokeWidth('palatino')}
            strokeLinejoin="round"
            className="tooth-surface"
            onClick={(e) => {
              e.stopPropagation()
              onSurfaceClick?.(numero, 'palatino')
            }}
            style={{ cursor }}
          />

          {/* MESIAL */}
          <path
            d={`M ${outerBox.right + 1} ${outerBox.top - 1}
                L ${outerBox.right + 1} ${outerBox.bottom + 1}
                L ${innerBox.right} ${innerBox.bottom}
                L ${innerBox.right} ${innerBox.top} Z`}
            fill={getSurfaceFill('mesial')}
            stroke={getSurfaceStroke('mesial')}
            strokeWidth={getSurfaceStrokeWidth('mesial')}
            strokeLinejoin="round"
            className="tooth-surface"
            onClick={(e) => {
              e.stopPropagation()
              onSurfaceClick?.(numero, 'mesial')
            }}
            style={{ cursor }}
          />

          {/* DISTAL */}
          <path
            d={`M ${outerBox.left - 1} ${outerBox.top - 1}
                L ${outerBox.left - 1} ${outerBox.bottom + 1}
                L ${innerBox.left} ${innerBox.bottom}
                L ${innerBox.left} ${innerBox.top} Z`}
            fill={getSurfaceFill('distal')}
            stroke={getSurfaceStroke('distal')}
            strokeWidth={getSurfaceStrokeWidth('distal')}
            strokeLinejoin="round"
            className="tooth-surface"
            onClick={(e) => {
              e.stopPropagation()
              onSurfaceClick?.(numero, 'distal')
            }}
            style={{ cursor }}
          />
        </g>

        {/* OCLUSAL */}
        <circle
          cx={cx}
          cy={cy}
          r={inner}
          fill={getSurfaceFill('oclusal')}
          stroke={getSurfaceStroke('oclusal')}
          strokeWidth={getSurfaceStrokeWidth('oclusal')}
          className="tooth-surface"
          onClick={(e) => {
            e.stopPropagation()
            onSurfaceClick?.(numero, 'oclusal')
          }}
          style={{ cursor }}
        />

        {/* Borde exterior */}
        <rect
          x={outerBox.left}
          y={outerBox.top}
          width={size * 2}
          height={size * 2}
          rx={r}
          ry={r}
          fill="none"
          stroke="#334155"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </g>
    )
  }

  // ============================
  // RAICES
  // ============================
  const renderRoots = () => {
    const centerX = width / 2
    const rootStartY = crownHeight + 4
    const rootColor = '#334155'

    // Check for root treatments in hallazgos array
    const hallazgos = data?.hallazgos || []
    const rootTreatments = ['endodoncia', 'endodoncia_mal', 'pulpectomia', 'pulpotomia',
      'espigo_munon', 'espigo_munon_mal', 'perno_fibra', 'perno_metalico']
    const rootHallazgo = hallazgos.find(h => rootTreatments.includes(h.id))
    const tcColor = rootHallazgo?.color || (data?.raiz?.tratamiento ? COLORS.AZUL : null)

    const rootStyle = {
      fill: 'none',
      stroke: rootColor,
      strokeWidth: 1.8,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }

    // Molares superiores: 3 raíces
    if (esMolar && raices >= 2 && superior && raices === 3) {
      return (
        <g className="tooth-roots">
          <path d={`M ${centerX - 8} ${rootStartY} Q ${centerX - 12} ${rootStartY + rootHeight * 0.5} ${centerX - 10} ${rootStartY + rootHeight}`} style={rootStyle} />
          <path d={`M ${centerX + 8} ${rootStartY} Q ${centerX + 12} ${rootStartY + rootHeight * 0.5} ${centerX + 10} ${rootStartY + rootHeight}`} style={rootStyle} />
          <path d={`M ${centerX} ${rootStartY} L ${centerX} ${rootStartY + rootHeight * 1.02}`} style={rootStyle} />
          {tcColor && (
            <>
              <line x1={centerX - 9} y1={rootStartY + 8} x2={centerX - 9} y2={rootStartY + rootHeight - 8} stroke={tcColor} strokeWidth={2.5} strokeLinecap="round" />
              <line x1={centerX + 9} y1={rootStartY + 8} x2={centerX + 9} y2={rootStartY + rootHeight - 8} stroke={tcColor} strokeWidth={2.5} strokeLinecap="round" />
              <line x1={centerX} y1={rootStartY + 8} x2={centerX} y2={rootStartY + rootHeight - 5} stroke={tcColor} strokeWidth={2.5} strokeLinecap="round" />
            </>
          )}
        </g>
      )
    }

    // Molares inferiores: 2 raíces
    if (esMolar && raices >= 2) {
      return (
        <g className="tooth-roots">
          <path d={`M ${centerX - 6} ${rootStartY} Q ${centerX - 10} ${rootStartY + rootHeight * 0.5} ${centerX - 8} ${rootStartY + rootHeight}`} style={rootStyle} />
          <path d={`M ${centerX + 6} ${rootStartY} Q ${centerX + 10} ${rootStartY + rootHeight * 0.5} ${centerX + 8} ${rootStartY + rootHeight}`} style={rootStyle} />
          {tcColor && (
            <>
              <line x1={centerX - 7} y1={rootStartY + 8} x2={centerX - 7} y2={rootStartY + rootHeight - 8} stroke={tcColor} strokeWidth={2.5} strokeLinecap="round" />
              <line x1={centerX + 7} y1={rootStartY + 8} x2={centerX + 7} y2={rootStartY + rootHeight - 8} stroke={tcColor} strokeWidth={2.5} strokeLinecap="round" />
            </>
          )}
        </g>
      )
    }

    // Premolares con 2 raíces
    if (raices === 2 && !esMolar) {
      return (
        <g className="tooth-roots">
          <path d={`M ${centerX - 4} ${rootStartY} Q ${centerX - 7} ${rootStartY + rootHeight * 0.5} ${centerX - 5} ${rootStartY + rootHeight * 0.8}`} style={rootStyle} />
          <path d={`M ${centerX + 4} ${rootStartY} Q ${centerX + 7} ${rootStartY + rootHeight * 0.5} ${centerX + 5} ${rootStartY + rootHeight * 0.8}`} style={rootStyle} />
          {tcColor && (
            <>
              <line x1={centerX - 5} y1={rootStartY + 8} x2={centerX - 5} y2={rootStartY + rootHeight * 0.7} stroke={tcColor} strokeWidth={2.5} strokeLinecap="round" />
              <line x1={centerX + 5} y1={rootStartY + 8} x2={centerX + 5} y2={rootStartY + rootHeight * 0.7} stroke={tcColor} strokeWidth={2.5} strokeLinecap="round" />
            </>
          )}
        </g>
      )
    }

    // Raíz única
    const rootLength = anterior ? rootHeight * 1.0 : rootHeight * 0.8
    return (
      <g className="tooth-roots">
        <path d={`M ${centerX} ${rootStartY} L ${centerX} ${rootStartY + rootLength}`} style={{ ...rootStyle, strokeWidth: anterior ? 2 : 1.8 }} />
        {tcColor && (
          <line x1={centerX} y1={rootStartY + 8} x2={centerX} y2={rootStartY + rootLength - 8} stroke={tcColor} strokeWidth={2.5} strokeLinecap="round" />
        )}
      </g>
    )
  }

  // ============================
  // MARCADORES (Hallazgos)
  // ============================
  const renderMarkers = () => {
    const centerX = width / 2
    const crownCenterY = textPad + crownHeight / 2 + 4
    const size = 13
    const rootStartY = textPad + crownHeight + 4
    const markers = []

    // Text label Y positions (in the padding zone)
    const textYAbove = 11  // centered in textPad zone

    // For superior teeth, the parent div applies scaleY(-1) which flips text upside down.
    // This helper returns a transform that counter-flips text around its center point.
    const flipText = (x, y) => {
      if (esInferior) return undefined  // inferior teeth are not flipped
      return `translate(${x}, ${y}) scale(1, -1) translate(${-x}, ${-y})`
    }

    // Read from new hallazgos array
    const hallazgos = data?.hallazgos || []

    // Also support legacy format
    const hasLegacy = data?.ausente || data?.fractura?.presente || data?.extrusion ||
      data?.intrusion || data?.giroversion || data?.migracion || data?.diastema ||
      data?.implante || data?.protesisFija || data?.protesisRemovible ||
      data?.ortodonciaFija || data?.ortodonciaRemovible || data?.raiz?.remanenteRadicular

    const hasHallazgo = (id) => hallazgos.some(h => h.id === id)
    const getColor = (id, fallback) => {
      const h = hallazgos.find(h => h.id === id)
      return h?.color || fallback || COLORS.AZUL
    }

    // ─── PIEZA AUSENTE (X azul) ───
    if (hasHallazgo('ausente') || data?.ausente) {
      const c = getColor('ausente', COLORS.AZUL)
      markers.push(
        <g key="ausente">
          <line x1={centerX - 16} y1={textPad + 6} x2={centerX + 16} y2={totalHeight - 6} stroke={c} strokeWidth={2.5} strokeLinecap="round" />
          <line x1={centerX + 16} y1={textPad + 6} x2={centerX - 16} y2={totalHeight - 6} stroke={c} strokeWidth={2.5} strokeLinecap="round" />
        </g>
      )
    }

    // ─── EXTRACCION (X roja) ───
    if (hasHallazgo('extraccion')) {
      const c = getColor('extraccion', COLORS.ROJO)
      markers.push(
        <g key="extraccion">
          <line x1={centerX - 16} y1={textPad + 6} x2={centerX + 16} y2={totalHeight - 6} stroke={c} strokeWidth={2.5} strokeLinecap="round" />
          <line x1={centerX + 16} y1={textPad + 6} x2={centerX - 16} y2={totalHeight - 6} stroke={c} strokeWidth={2.5} strokeLinecap="round" />
        </g>
      )
    }

    // ─── FRACTURA (línea diagonal roja) ───
    if (hasHallazgo('fractura') || data?.fractura?.presente) {
      markers.push(
        <line key="fractura" x1={centerX - 10} y1={crownCenterY - 10} x2={centerX + 10} y2={crownCenterY + 10} stroke={COLORS.ROJO} strokeWidth={2} strokeLinecap="round" />
      )
    }

    // ─── REMANENTE RADICULAR (RR text) ───
    if (hasHallazgo('remanente_radicular') || data?.raiz?.remanenteRadicular) {
      const rrY = textPad + crownHeight + 28
      markers.push(
        <g key="rr" transform={flipText(centerX, rrY - 3)}>
          <rect x={centerX - 10} y={rrY - 9} width={20} height={12} rx={3} fill="white" fillOpacity={0.9} />
          <text x={centerX} y={rrY} textAnchor="middle" fill={COLORS.ROJO} fontSize={10} fontWeight="bold" fontFamily="Inter, sans-serif">
            RR
          </text>
        </g>
      )
    }

    // ─── FOSA Y FISURAS PROFUNDAS (FFP text above) ───
    if (hasHallazgo('fosa_fisuras')) {
      const c = getColor('fosa_fisuras', COLORS.ROJO)
      markers.push(
        <g key="ffp" transform={flipText(centerX, textYAbove - 2)}>
          <rect x={centerX - 13} y={textYAbove - 9} width={26} height={13} rx={3} fill="white" fillOpacity={0.9} stroke={c} strokeWidth={0.5} />
          <text x={centerX} y={textYAbove + 1} textAnchor="middle" fill={c} fontSize={9} fontWeight="bold" fontFamily="Inter, sans-serif">
            FFP
          </text>
        </g>
      )
    }

    // ─── SIGLA-BASED MARKERS (DES, MAC, MIC, DIS, E, I, S) ───
    const siglaMarkers = [
      { id: 'desgaste', label: 'DES' },
      { id: 'macrodoncia', label: 'MAC' },
      { id: 'microdoncia', label: 'MIC' },
      { id: 'discromico', label: 'DIS' },
      { id: 'ectopico', label: 'E' },
      { id: 'impactacion', label: 'I' },
    ]
    for (const sm of siglaMarkers) {
      if (hasHallazgo(sm.id)) {
        const c = getColor(sm.id, COLORS.AZUL)
        const labelW = sm.label.length * 7 + 6
        markers.push(
          <g key={sm.id} transform={flipText(centerX, textYAbove - 2)}>
            <rect x={centerX - labelW / 2} y={textYAbove - 9} width={labelW} height={13} rx={3} fill="white" fillOpacity={0.9} stroke={c} strokeWidth={0.5} />
            <text x={centerX} y={textYAbove + 1} textAnchor="middle" fill={c} fontSize={9} fontWeight="bold" fontFamily="Inter, sans-serif">
              {sm.label}
            </text>
          </g>
        )
      }
    }

    // ─── MOVILIDAD (M + grado romano above) ───
    const movilidades = [
      { id: 'movilidad_1', label: 'M:I' },
      { id: 'movilidad_2', label: 'M:II' },
      { id: 'movilidad_3', label: 'M:III' },
    ]
    for (const mv of movilidades) {
      if (hasHallazgo(mv.id)) {
        const labelW = mv.label.length * 6 + 6
        markers.push(
          <g key={mv.id} transform={flipText(centerX, textYAbove - 2)}>
            <rect x={centerX - labelW / 2} y={textYAbove - 9} width={labelW} height={13} rx={3} fill="white" fillOpacity={0.9} stroke={COLORS.AZUL} strokeWidth={0.5} />
            <text x={centerX} y={textYAbove + 1} textAnchor="middle" fill={COLORS.AZUL} fontSize={8} fontWeight="bold" fontFamily="Inter, sans-serif">
              {mv.label}
            </text>
          </g>
        )
      }
    }

    // ─── SELLANTES (S on oclusal) ───
    if (hasHallazgo('sellantes')) {
      markers.push(
        <g key="sellantes" transform={flipText(centerX, crownCenterY)}>
          <circle cx={centerX} cy={crownCenterY} r={7} fill="white" fillOpacity={0.85} />
          <text x={centerX} y={crownCenterY + 4} textAnchor="middle" fill={COLORS.AZUL} fontSize={11} fontWeight="bold" fontFamily="Inter, sans-serif">
            S
          </text>
        </g>
      )
    }

    // ─── DEFECTOS DE ESMALTE (yellow circle) ───
    if (hasHallazgo('defectos_esmalte')) {
      markers.push(
        <circle key="defectos_esmalte" cx={centerX} cy={crownCenterY} r={6} fill={COLORS.AMARILLO} stroke="#DAA520" strokeWidth={1.5} opacity={0.85} />
      )
    }

    // ─── CORONA (square outline around crown) ───
    if (hasHallazgo('corona')) {
      markers.push(
        <rect key="corona" x={centerX - size - 4} y={crownCenterY - size - 4} width={(size + 4) * 2} height={(size + 4) * 2} rx={1} fill="none" stroke={COLORS.AZUL} strokeWidth={2} />
      )
    }

    // ─── CORONA TEMPORAL (square outline red) ───
    if (hasHallazgo('corona_temporal')) {
      markers.push(
        <rect key="corona_temp" x={centerX - size - 4} y={crownCenterY - size - 4} width={(size + 4) * 2} height={(size + 4) * 2} rx={1} fill="none" stroke={COLORS.ROJO} strokeWidth={2} />
      )
    }

    // ─── CARILLAS (U-shape on vestibular side) ───
    if (hasHallazgo('carillas')) {
      const cy = crownCenterY - size + 2
      markers.push(
        <path key="carillas" d={`M ${centerX - 8} ${cy} L ${centerX - 8} ${cy + 12} Q ${centerX} ${cy + 18} ${centerX + 8} ${cy + 12} L ${centerX + 8} ${cy}`}
          fill={COLORS.AZUL} fillOpacity={0.6} stroke={COLORS.AZUL} strokeWidth={1.5} strokeLinecap="round" />
      )
    }

    // ─── CARILLAS MAL ESTADO (U-shape red) ───
    if (hasHallazgo('carillas_mal')) {
      const cy = crownCenterY - size + 2
      markers.push(
        <path key="carillas_mal" d={`M ${centerX - 8} ${cy} L ${centerX - 8} ${cy + 12} Q ${centerX} ${cy + 18} ${centerX + 8} ${cy + 12} L ${centerX + 8} ${cy}`}
          fill={COLORS.ROJO} fillOpacity={0.6} stroke={COLORS.ROJO} strokeWidth={1.5} strokeLinecap="round" />
      )
    }

    // ─── LESION CERVICAL (V notch at cervical) ───
    if (hasHallazgo('lesion_cervical')) {
      const cervY = crownHeight + 2
      markers.push(
        <path key="lesion_cervical" d={`M ${centerX - 6} ${cervY - 2} L ${centerX} ${cervY + 5} L ${centerX + 6} ${cervY - 2}`}
          fill="none" stroke={COLORS.ROJO} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      )
    }

    // ─── GINGIVITIS (wavy red line at gum line) ───
    if (hasHallazgo('gingivitis')) {
      const gumY = crownHeight + 2
      markers.push(
        <path key="gingivitis"
          d={`M ${centerX - 12} ${gumY} Q ${centerX - 8} ${gumY - 4} ${centerX - 4} ${gumY} Q ${centerX} ${gumY + 4} ${centerX + 4} ${gumY} Q ${centerX + 8} ${gumY - 4} ${centerX + 12} ${gumY}`}
          fill="none" stroke={COLORS.ROJO} strokeWidth={1.8} strokeLinecap="round" />
      )
    }

    // ─── EXTRUSION (arrow toward occlusal) ───
    if (hasHallazgo('extrusion') || data?.extrusion) {
      const arrowY = esInferior ? totalHeight - 4 : textPad + 2
      const arrowDir = esInferior ? -1 : 1
      markers.push(
        <g key="extrusion">
          <line x1={centerX} y1={arrowY + (4 * arrowDir)} x2={centerX} y2={arrowY + (16 * arrowDir)} stroke={COLORS.AZUL} strokeWidth={2} strokeLinecap="round" />
          <polygon points={`${centerX},${arrowY} ${centerX - 4},${arrowY + (8 * arrowDir)} ${centerX + 4},${arrowY + (8 * arrowDir)}`} fill={COLORS.AZUL} />
        </g>
      )
    }

    // ─── INTRUSION (arrow toward apex) ───
    if (hasHallazgo('intrusion') || data?.intrusion) {
      const arrowY = esInferior ? textPad + 2 : totalHeight - 4
      const arrowDir = esInferior ? 1 : -1
      markers.push(
        <g key="intrusion">
          <line x1={centerX} y1={arrowY + (4 * arrowDir)} x2={centerX} y2={arrowY + (16 * arrowDir)} stroke={COLORS.AZUL} strokeWidth={2} strokeLinecap="round" />
          <polygon points={`${centerX},${arrowY} ${centerX - 4},${arrowY + (8 * arrowDir)} ${centerX + 4},${arrowY + (8 * arrowDir)}`} fill={COLORS.AZUL} />
        </g>
      )
    }

    // ─── INTRUSION ANQUILOSIS (arrow + bar) ───
    if (hasHallazgo('intrusion_anquilosis')) {
      const arrowY = esInferior ? textPad + 2 : totalHeight - 4
      const arrowDir = esInferior ? 1 : -1
      markers.push(
        <g key="anquilosis">
          <line x1={centerX} y1={arrowY + (4 * arrowDir)} x2={centerX} y2={arrowY + (16 * arrowDir)} stroke={COLORS.AZUL} strokeWidth={2} strokeLinecap="round" />
          <polygon points={`${centerX},${arrowY} ${centerX - 4},${arrowY + (8 * arrowDir)} ${centerX + 4},${arrowY + (8 * arrowDir)}`} fill={COLORS.AZUL} />
          <line x1={centerX - 6} y1={arrowY + (14 * arrowDir)} x2={centerX + 6} y2={arrowY + (14 * arrowDir)} stroke={COLORS.AZUL} strokeWidth={2.5} strokeLinecap="round" />
        </g>
      )
    }

    // ─── GIROVERSION (curved arrow at occlusal) ───
    if (hasHallazgo('giroversion') || data?.giroversion) {
      const dir = data?.giroversion?.direccion === 'mesial' ? 1 : 1
      markers.push(
        <g key="giroversion">
          <path
            d={`M ${centerX - 8} ${crownCenterY} A 8 8 0 0 0 ${centerX + 8} ${crownCenterY}`}
            fill="none" stroke={COLORS.AZUL} strokeWidth={2} strokeLinecap="round"
          />
          <polygon points={`${centerX + 8},${crownCenterY} ${centerX + 4},${crownCenterY - 4} ${centerX + 4},${crownCenterY + 4}`} fill={COLORS.AZUL} />
        </g>
      )
    }

    // ─── POSICION DENTARIA / MIGRACION (horizontal arrow) ───
    if (hasHallazgo('posicion_dentaria') || data?.migracion) {
      const dir = data?.migracion?.direccion === 'mesial' ? 1 : 1
      markers.push(
        <g key="posicion">
          <line x1={centerX - 10} y1={crownCenterY} x2={centerX + 10} y2={crownCenterY} stroke={COLORS.AZUL} strokeWidth={2} strokeLinecap="round" />
          <polygon points={`${centerX + 12},${crownCenterY} ${centerX + 6},${crownCenterY - 4} ${centerX + 6},${crownCenterY + 4}`} fill={COLORS.AZUL} />
        </g>
      )
    }

    // ─── DIASTEMA (crossed lines between teeth) ───
    if (hasHallazgo('diastema') || data?.diastema) {
      markers.push(
        <g key="diastema">
          <line x1={centerX + 14} y1={crownCenterY - 8} x2={centerX + 22} y2={crownCenterY + 8} stroke={COLORS.AZUL} strokeWidth={1.8} strokeLinecap="round" />
          <line x1={centerX + 22} y1={crownCenterY - 8} x2={centerX + 14} y2={crownCenterY + 8} stroke={COLORS.AZUL} strokeWidth={1.8} strokeLinecap="round" />
        </g>
      )
    }

    // ─── IMPLANTE (screw shape in root) ───
    if (hasHallazgo('implante') || data?.implante) {
      const c = getColor('implante', COLORS.AZUL)
      markers.push(
        <g key="implante">
          <rect x={centerX - 4} y={crownHeight + 10} width={8} height={rootHeight - 15} fill={c} rx={1} />
          <circle cx={centerX} cy={crownHeight + 6} r={5} fill="none" stroke={c} strokeWidth={2} />
        </g>
      )
    }

    // ─── IMPLANTE MAL ESTADO ───
    if (hasHallazgo('implante_mal')) {
      markers.push(
        <g key="implante_mal">
          <rect x={centerX - 4} y={crownHeight + 10} width={8} height={rootHeight - 15} fill={COLORS.ROJO} rx={1} />
          <circle cx={centerX} cy={crownHeight + 6} r={5} fill="none" stroke={COLORS.ROJO} strokeWidth={2} />
        </g>
      )
    }

    // ─── PIEZA EN ERUPCION (partial arrow up) ───
    if (hasHallazgo('en_erupcion')) {
      const arrowY = esInferior ? totalHeight - 8 : textPad + 6
      const dir = esInferior ? -1 : 1
      markers.push(
        <g key="erupcion">
          <line x1={centerX} y1={arrowY} x2={centerX} y2={arrowY + (10 * dir)} stroke={COLORS.AZUL} strokeWidth={1.8} strokeLinecap="round" strokeDasharray="3,2" />
          <polygon points={`${centerX},${arrowY} ${centerX - 3},${arrowY + (5 * dir)} ${centerX + 3},${arrowY + (5 * dir)}`} fill={COLORS.AZUL} />
        </g>
      )
    }

    // ─── NO ERUPCIONADO (dashed outline) ───
    if (hasHallazgo('no_erupcionado')) {
      markers.push(
        <rect key="no_erupcionado" x={centerX - size} y={crownCenterY - size} width={size * 2} height={size * 2} rx={4}
          fill="none" stroke={COLORS.AZUL} strokeWidth={1.5} strokeDasharray="4,3" />
      )
    }

    // ─── EDENTULO TOTAL (horizontal line over crown) ───
    if (hasHallazgo('edentulo_total')) {
      markers.push(
        <line key="edentulo" x1={centerX - 16} y1={crownCenterY} x2={centerX + 16} y2={crownCenterY} stroke={COLORS.AZUL} strokeWidth={3} strokeLinecap="round" />
      )
    }

    // ─── DIENTE EN CLAVIJA (triangle around number area) ───
    if (hasHallazgo('diente_clavija')) {
      const ty = esInferior ? totalHeight + 4 : textPad - 2
      markers.push(
        <polygon key="clavija"
          points={`${centerX},${ty - 6} ${centerX - 8},${ty + 6} ${centerX + 8},${ty + 6}`}
          fill="none" stroke={COLORS.AZUL} strokeWidth={1.5} />
      )
    }

    // ─── SUPERNUMERARIO (S in circle) ───
    if (hasHallazgo('supernumerario')) {
      const sy = rootStartY + rootHeight * 0.6
      markers.push(
        <g key="supernumerario">
          <circle cx={centerX + 14} cy={sy} r={7} fill="white" stroke={COLORS.AZUL} strokeWidth={1.5} />
          <text x={centerX + 14} y={sy + 3.5} textAnchor="middle" fill={COLORS.AZUL} fontSize={9} fontWeight="bold" fontFamily="Inter, sans-serif">S</text>
        </g>
      )
    }

    // ─── FUSION (two overlapping circles) ───
    if (hasHallazgo('fusion') || hasHallazgo('geminacion')) {
      const fy = rootStartY + rootHeight * 0.5
      markers.push(
        <g key="fusion">
          <circle cx={centerX - 4} cy={fy} r={7} fill="none" stroke={COLORS.AZUL} strokeWidth={1.5} />
          <circle cx={centerX + 4} cy={fy} r={7} fill="none" stroke={COLORS.AZUL} strokeWidth={1.5} />
        </g>
      )
    }

    // ─── FRENILLO CORTO (inverted V between roots) ───
    if (hasHallazgo('frenillo_corto')) {
      const fy = rootStartY + 8
      markers.push(
        <path key="frenillo"
          d={`M ${centerX - 8} ${fy + 12} Q ${centerX} ${fy - 2} ${centerX + 8} ${fy + 12}`}
          fill="none" stroke={COLORS.ROJO} strokeWidth={2} strokeLinecap="round" />
      )
    }

    // ─── ESPIGO MUÑON (T-shape: line in root + square at top) ───
    if (hasHallazgo('espigo_munon') || hasHallazgo('espigo_munon_mal')) {
      const c = hasHallazgo('espigo_munon_mal') ? COLORS.ROJO : COLORS.AZUL
      markers.push(
        <g key="espigo">
          <line x1={centerX} y1={rootStartY + 6} x2={centerX} y2={rootStartY + rootHeight * 0.6} stroke={c} strokeWidth={2.5} strokeLinecap="round" />
          <rect x={centerX - 4} y={rootStartY + 2} width={8} height={6} fill={c} rx={1} />
        </g>
      )
    }

    // ─── PERNO DE FIBRA (line + empty circle) ───
    if (hasHallazgo('perno_fibra')) {
      markers.push(
        <g key="perno_fibra">
          <line x1={centerX} y1={rootStartY + 10} x2={centerX} y2={rootStartY + rootHeight * 0.6} stroke={COLORS.AZUL} strokeWidth={2} strokeLinecap="round" />
          <circle cx={centerX} cy={rootStartY + 6} r={4} fill="white" stroke={COLORS.AZUL} strokeWidth={2} />
        </g>
      )
    }

    // ─── PERNO METALICO (line + filled square) ───
    if (hasHallazgo('perno_metalico')) {
      markers.push(
        <g key="perno_metalico">
          <line x1={centerX} y1={rootStartY + 10} x2={centerX} y2={rootStartY + rootHeight * 0.6} stroke={COLORS.AZUL} strokeWidth={2} strokeLinecap="round" />
          <rect x={centerX - 4} y={rootStartY + 2} width={8} height={8} fill={COLORS.AZUL} rx={1} />
        </g>
      )
    }

    // ─── PROTESIS FIJA (horizontal line across tooth) ───
    if (hasHallazgo('protesis_fija') || hasHallazgo('protesis_fija_mal') || data?.protesisFija) {
      const c = hasHallazgo('protesis_fija_mal') ? COLORS.ROJO : COLORS.AZUL
      markers.push(
        <line key="pf" x1={-2} y1={2} x2={width + 2} y2={2} stroke={c} strokeWidth={3} strokeLinecap="round" />
      )
    }

    // ─── PROTESIS REMOVIBLE (double horizontal line) ───
    if (hasHallazgo('protesis_removible') || hasHallazgo('protesis_removible_mal') || data?.protesisRemovible) {
      const c = hasHallazgo('protesis_removible_mal') ? COLORS.ROJO : COLORS.AZUL
      markers.push(
        <g key="pr">
          <line x1={-2} y1={1} x2={width + 2} y2={1} stroke={c} strokeWidth={2} strokeLinecap="round" />
          <line x1={-2} y1={5} x2={width + 2} y2={5} stroke={c} strokeWidth={2} strokeLinecap="round" />
        </g>
      )
    }

    // ─── PROTESIS TOTAL (double horizontal lines over crowns) ───
    if (hasHallazgo('protesis_total') || hasHallazgo('protesis_total_mal')) {
      const c = hasHallazgo('protesis_total_mal') ? COLORS.ROJO : COLORS.AZUL
      markers.push(
        <g key="pt">
          <line x1={-2} y1={crownCenterY - 1} x2={width + 2} y2={crownCenterY - 1} stroke={c} strokeWidth={2} strokeLinecap="round" />
          <line x1={-2} y1={crownCenterY + 3} x2={width + 2} y2={crownCenterY + 3} stroke={c} strokeWidth={2} strokeLinecap="round" />
        </g>
      )
    }

    // ─── APARATO ORTODONTICO FIJO (bracket + wire) ───
    if (hasHallazgo('ortodoncia_fija') || hasHallazgo('ortodoncia_fija_mal') || data?.ortodonciaFija) {
      const c = hasHallazgo('ortodoncia_fija_mal') ? COLORS.ROJO : COLORS.AZUL
      markers.push(
        <g key="of">
          {/* Bracket (square with cross) */}
          <rect x={centerX - 5} y={crownCenterY - 5} width={10} height={10} fill="white" stroke={c} strokeWidth={1.5} rx={1} />
          <line x1={centerX} y1={crownCenterY - 5} x2={centerX} y2={crownCenterY + 5} stroke={c} strokeWidth={1} />
          <line x1={centerX - 5} y1={crownCenterY} x2={centerX + 5} y2={crownCenterY} stroke={c} strokeWidth={1} />
          {/* Wire */}
          <line x1={-2} y1={crownCenterY} x2={width + 2} y2={crownCenterY} stroke={c} strokeWidth={1.5} />
        </g>
      )
    }

    // ─── APARATO ORTODONTICO REMOVIBLE (chevron/zigzag) ───
    if (hasHallazgo('ortodoncia_removible') || hasHallazgo('ortodoncia_removible_mal') || data?.ortodonciaRemovible) {
      const c = hasHallazgo('ortodoncia_removible_mal') ? COLORS.ROJO : COLORS.AZUL
      markers.push(
        <path key="or"
          d={`M ${centerX - 12} ${crownCenterY + size + 6} L ${centerX} ${crownCenterY + size - 2} L ${centerX + 12} ${crownCenterY + size + 6}`}
          fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        />
      )
    }

    return markers
  }

  return (
    <svg
      width={width}
      height={totalHeight}
      viewBox={`0 0 ${width} ${totalHeight}`}
      className={`tooth-svg ${isSelected ? 'selected' : ''}`}
      onClick={() => onToothClick?.(numero)}
      style={{
        cursor,
        transition: 'transform 0.15s ease',
        overflow: 'visible',
        filter: isSelected ? 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))' : 'none',
      }}
    >
      {/* Offset all tooth content down by textPad */}
      <g transform={`translate(0, ${textPad})`}>
        {/* Raíces (detrás) */}
        {esInferior ? renderCrown() : renderRoots()}

        {/* Corona (adelante) */}
        {esInferior ? renderRoots() : renderCrown()}
      </g>

      {/* Marcadores especiales */}
      {renderMarkers()}
    </svg>
  )
}
