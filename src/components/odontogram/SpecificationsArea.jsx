// Area de especificaciones segun norma tecnica
// Para explicar, determinar, aclarar hallazgos que no pueden ser registrados graficamente

export default function SpecificationsArea({
  value = '',
  onChange,
  readOnly = false,
}) {
  const styles = {
    container: {
      marginTop: '24px',
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      border: '1px solid #e2e8f0',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '12px',
    },
    icon: {
      width: '32px',
      height: '32px',
      borderRadius: '8px',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '16px',
    },
    title: {
      fontSize: '14px',
      fontWeight: '700',
      color: '#0f766e',
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
    },
    textarea: {
      width: '100%',
      minHeight: '120px',
      padding: '14px 16px',
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
      fontSize: '14px',
      fontFamily: "'Inter', -apple-system, sans-serif",
      lineHeight: '1.6',
      color: '#334155',
      background: '#f8fafc',
      resize: 'vertical',
      outline: 'none',
      transition: 'all 0.2s ease',
    },
    textareaFocus: {
      borderColor: '#14b8a6',
      background: 'white',
      boxShadow: '0 0 0 3px rgba(20, 184, 166, 0.1)',
    },
    hint: {
      marginTop: '10px',
      fontSize: '12px',
      color: '#64748b',
      lineHeight: '1.5',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '6px',
    },
    hintIcon: {
      color: '#94a3b8',
      flexShrink: 0,
      marginTop: '2px',
    },
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.icon}>📋</div>
        <span style={styles.title}>Observaciones Adicionales</span>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
        placeholder="Registrar hallazgos que no pueden ser representados gráficamente.&#10;&#10;Ejemplos:&#10;• Color de corona (dorada/plateada)&#10;• Tipo de aparatología ortodóntica&#10;• Clasificación de movilidad utilizada&#10;• Observaciones clínicas adicionales"
        style={styles.textarea}
        onFocus={(e) => {
          Object.assign(e.target.style, styles.textareaFocus)
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#e2e8f0'
          e.target.style.background = '#f8fafc'
          e.target.style.boxShadow = 'none'
        }}
        rows={5}
      />

      <div style={styles.hint}>
        <span style={styles.hintIcon}>ℹ️</span>
        <span>
          Según norma técnica: Explicar, determinar y aclarar con individualidad
          los hallazgos que no pueden ser registrados gráficamente.
        </span>
      </div>
    </div>
  )
}

