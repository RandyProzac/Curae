# Plan: Citas de Emergencia

## Objetivo
Permitir a los doctores y recepcionistas registrar **Citas de Emergencia** que tienen la capacidad de superponerse en el calendario con citas existentes, compartiendo la columna visualmente, sin lanzar alertas de bloqueo y sincronizándose correctamente con Google Calendar.

## Requerimientos y Reglas de Negocio
1. **Acceso:** Cualquier doctor o administrador puede crearlas.
2. **UI:** Botón dedicado **"+ Emergencia"** al lado del botón de Nueva Cita.
3. **Visualización:** Mismo color asignado al doctor, pero incluye un icono 🚨. Si se superpone con otra cita, el sistema las mostrará en columnas compartidas (una al lado de la otra).
4. **Duración:** Tiempo variable definido por el usuario (igual que una cita normal).
5. **Superposición:** Pueden sobreponerse a citas normales o a otras emergencias. Se mostrarán por defecto al lado o por encima (z-index) de la cita previa.
6. **Alertas:** No se mostrará ninguna alerta de conflicto de horario si la cita a registrar es una emergencia.
7. **Sincronización:** Se sincronizará con Google Calendar agregando el prefijo `[🚨 EMERGENCIA]` al título del evento para fácil identificación en el celular.

---

## Tareas de Implementación (Task Breakdown)

### Fase 1: Base de Datos
- Crear un archivo de migración SQL (`supabase/migrations/..._add_is_emergency_to_appointments.sql`).
- Agregar la columna `is_emergency BOOLEAN DEFAULT false` a la tabla `appointments`.

### Fase 2: Lógica de UI (AppointmentsPage.jsx)
- **Botón:** Agregar el botón **"+ Emergencia"** (rojo o llamativo) junto a los controles de calendario.
- **Estado del Modal:** Añadir un estado `isEmergencyModal` para saber si el formulario abierto es de emergencia.
- **Validación:** Modificar la función `validateAppointment(date, start, end, doctorId, excludeId)` para que:
  - Si `isEmergencyModal` es `true`, **no ejecute** la validación de superposición.
  - Si la cita existente en el bucle tiene `is_emergency === true`, tampoco genere conflicto para nuevas citas.
- **Guardado:** Al guardar la cita, incluir `is_emergency: isEmergencyModal` en el payload.

### Fase 3: Renderizado en el Calendario
- Modificar el bloque de `Appointments Overlap (Dynamic Layout)` (aprox. línea 1383 en `AppointmentsPage.jsx`) para mostrar el icono 🚨 al lado del nombre del paciente o servicio cuando `apt.is_emergency` es `true`.
- Asegurar que la estructura CSS/Inline Styles para las citas superpuestas le de un `z-index` mayor a la cita de emergencia para asegurar visibilidad en caso de apilamiento denso.

### Fase 4: Sincronización con Google Calendar
- Modificar el payload de `gcalPayload` en `AppointmentsPage.jsx` y `googleCalendarService.js`.
- Si `savedData.is_emergency` es `true`, ajustar el `summary` del evento a: `[🚨 EMERGENCIA] - Paciente: Nombre - Doctor`.

---

## Asignación de Agentes
- `@project-planner` -> Creación y validación de este plan (Completado).
- `@backend-specialist` -> Ejecución de SQL y adaptación de llamadas a Supabase.
- `@frontend-specialist` -> Creación del botón, gestión del estado del modal, validación anti-colisión y renderizado de la interfaz del calendario.

---

## Criterios de Verificación (Checklist)
- [ ] La columna `is_emergency` existe en Supabase.
- [ ] Al hacer clic en "+ Emergencia", el formulario de cita aparece y permite guardar encima de otra cita sin errores.
- [ ] En el calendario de Curae, la emergencia aparece al lado de la cita existente con el icono 🚨.
- [ ] En Google Calendar, la emergencia aparece correctamente sincronizada y con el prefijo visual.
