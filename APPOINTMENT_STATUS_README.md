# Sistema de Estados de Citas - Curae Online

## 📋 Descripción
Sistema completo de gestión de estados para citas médicas con auditoría de cambios.

## 🎯 Estados Disponibles

| Estado | Valor | Ícono | Color | Descripción |
|--------|-------|-------|-------|-------------|
| **Pendiente** | `pending` | ⏳ | Amarillo (#f59e0b) | Estado inicial, esperando confirmación |
| **Confirmado** | `confirmed` | ✓ | Verde (#10b981) | Cita confirmada por el paciente |
| **Atendido** | `attended` | ✓✓ | Azul (#3b82f6) | Paciente atendido exitosamente |
| **Cancelado** | `cancelled` | ⊗ | Rojo (#ef4444) | Cita cancelada |

## 🚀 Instalación

### 1. Ejecutar Migración de Base de Datos

Ejecuta el siguiente script SQL en tu consola de Supabase:

```bash
# Desde la raíz del proyecto
cat supabase/add_status_tracking.sql
```

Luego copia y pega el contenido en **Supabase SQL Editor** y ejecuta.

#### Cambios en la Base de Datos:
- ✅ Agrega columna `status_updated_at` (timestamp)
- ✅ Agrega columna `status_updated_by` (varchar)
- ✅ Agrega constraint para validar estados permitidos
- ✅ Agrega índice para optimizar consultas por estado
- ✅ Agrega trigger para auto-actualizar timestamp en cambios
- ✅ Migra registros existentes de 'scheduled' → 'pending'

### 2. Verificar Variables de Entorno

Asegúrate de tener configurado:

```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### 3. Reiniciar Servidor de Desarrollo

```bash
npm run dev
```

## 🎨 Características Implementadas

### ✅ Visualización en Calendario
- Íconos distintivos en cada tarjeta de cita
- Colores por estado en el badge del modal
- Indicador visual inmediato del estado

### ✅ Modal de Detalles Mejorado
- Badge de estado con ícono y color dinámico
- 3 botones de acción grandes:
  - **Confirmar** (Verde)
  - **Marcar Atendido** (Azul)
  - **Cancelar** (Rojo)
- Deshabilitación automática del botón del estado actual
- Efectos hover con colores de fondo

### ✅ Transiciones de Estado
- **Totalmente flexible**: Puedes cambiar a cualquier estado desde cualquier estado
- **Reversibilidad**: Puedes revertir cambios (ej: Cancelado → Confirmado)
- **Actualización optimista**: UI se actualiza inmediatamente, luego sincroniza con servidor
- **Manejo de errores**: Revierte cambios si falla la actualización

### ✅ Auditoría
- `status_updated_at`: Timestamp de última actualización
- `status_updated_by`: Usuario que realizó el cambio (actualmente 'Usuario', puede integrarse con autenticación)
- Trigger automático que actualiza el timestamp en cada cambio

### ✅ Persistencia
- Las citas **Canceladas** y **Atendidas** se mantienen visibles
- Útil para control y auditoría histórica
- Pueden filtrarse manualmente si es necesario en el futuro

## 📁 Archivos Modificados

```
src/
├── utils/constants.js           ← NUEVO: Configuración de estados
├── lib/supabase.js              ← Agregado: updateStatus() API
└── pages/AppointmentsPage.jsx   ← Modificado: UI + lógica de estados

supabase/
└── add_status_tracking.sql      ← NUEVO: Migración de BD
```

## 🔧 API de Estado

### Actualizar Estado de una Cita

```javascript
import { appointmentsApi } from '../lib/supabase';

// Cambiar estado
await appointmentsApi.updateStatus(
    appointmentId,    // UUID de la cita
    'confirmed',      // Nuevo estado
    'Dr. Mendoza'     // Usuario que realiza el cambio (opcional)
);
```

### Obtener Configuración de Estado

```javascript
import { getStatusConfig } from '../utils/constants';

const config = getStatusConfig('pending');
console.log(config);
// {
//   value: 'pending',
//   label: 'Pendiente',
//   color: '#f59e0b',
//   bgColor: '#fef3c7',
//   icon: '⏳',
//   description: 'Cita programada, esperando confirmación'
// }
```

## 🐛 Solución de Problemas

### Error: "column status_updated_at does not exist"
**Solución**: Ejecuta la migración `add_status_tracking.sql` en Supabase SQL Editor.

### Error: "invalid input value for enum status"
**Solución**: Asegúrate de que la constraint fue creada correctamente. Ejecuta:
```sql
SELECT conname, contype FROM pg_constraint WHERE conname = 'appointments_status_check';
```

### Las citas nuevas aparecen como "undefined"
**Solución**: Limpia la caché del navegador y recarga. El default es `'pending'`.

## 🎯 Próximas Mejoras

- [ ] Integración con sistema de autenticación para `status_updated_by`
- [ ] Historial completo de cambios de estado (tabla `appointment_status_history`)
- [ ] Filtros avanzados por estado en el calendario
- [ ] Notificaciones automáticas al cambiar estado
- [ ] Métricas y reportes por estado

## 📞 Soporte

Si encuentras algún problema, revisa los logs de la consola del navegador y verifica que:
1. La migración SQL se ejecutó correctamente
2. Las variables de entorno están configuradas
3. El servidor de desarrollo está corriendo

---

**Versión**: 1.0.0  
**Última actualización**: 2026-02-10
