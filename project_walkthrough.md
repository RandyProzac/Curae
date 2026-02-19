# 🏥 Curae Online - Project Walkthrough & Gap Analysis

Este documento detalla el estado actual del proyecto e identifica las áreas críticas y funcionalidades faltantes para alcanzar una versión 1.0 lista para producción.

## 🚦 Estado Actual
El proyecto tiene una base sólida de Frontend con una **UI/UX pulida** y moderna. La autenticación básica y la estructura de navegación están implementadas.

- **Frontend:** React + Vite + CSS Modules (Diseño responsivo y limpio).
- **Backend:** Supabase (Integración parcial).
- **Módulos Activos:** Citas (Calendario), Pacientes (Lista), Historia Clínica (UI), Odontograma (UI).

---

## 🛑 1. Brechas Críticas (Prioridad Alta)
*Lo que impide que el sistema sea funcionalmente utilizable hoy.*

### A. Persistencia de Datos (Historia Clínica)
Actualmente, la **Historia Clínica** es puramente visual.
- **Falta:** Conexión real con Supabase en `ClinicalHistoryPage.jsx`.
- **Detalle:** Al hacer clic en "Guardar", solo se hace un `console.log`. Se necesita crear la tabla `clinical_histories` en Supabase y conectar la función `insert`.
- **Riesgo:** Los doctores perderán todos los datos ingresados al recargar.

### B. Gestión de Pacientes Real
- **Falta:** Confirmación de creación/edición de pacientes en base de datos.
- **Detalle:** Verificar si el `NewPatientModal` realmente escribe en la tabla `patients` o solo actualiza el estado local.

### C. Almacenamiento de Archivos (Rayos X / Imágenes)
- **Falta:** Sistema de subida de archivos.
- **Detalle:** La sección "Examen Radiográfico" es solo texto. Debería permitir subir imágenes (Buckets de Supabase Storage) para guardar radiografías y fotos intraorales.

---

## 🚧 2. Módulos Faltantes (Prioridad Media)
*Funcionalidades esenciales para una clínica que están marcadas como "Próximamente".*

### A. Dashboard Principal (Panel de Control)
- **Estado:** Estático / Placeholder.
- **Necesidad:** Widgets reales que consuman datos:
    - Pacientes vistos hoy/semana.
    - Ingresos estimados.
    - Próximas citas inmediatas.

### B. Módulo de Reportes
- **Estado:** Placeholder en Router.
- **Necesidad:** Gráficos simples (pacientes nuevos por mes, tratamientos más comunes).

### C. Configuración (Settings)
- **Estado:** Placeholder.
- **Necesidad:**
    - Gestión de usuarios (Crear nuevos doctores/asistentes).
    - Configuración de la clínica (Logo, Dirección para impresiones).

---

## 💰 3. Área Financiera (El Gran Ausente)
*No existe actualmente mención a pagos o presupuestos.*

### A. Presupuestos y Tratamientos
- **Falta:** Capacidad de seleccionar dientes en el odontograma y generar un "Presupuesto" con costos.
- **Necesidad:** Tabla de precios (Lista de tratamientos y costos) y generación de PDF de presupuesto.

### B. Control de Caja
- **Falta:** Registro de pagos de pacientes.
- **Necesidad:** Saber quién ha pagado, quién debe, y generar recibos simples.

---

## ✨ 4. Mejoras de Experiencia (UX/UI)

### A. Impresión (Print Styles)
- **Detalle:** El botón "Imprimir" en Historia Clínica necesita una hoja de estilos `@media print` específica para que salga limpio en papel A4 (ocultando menús, botones, etc.).

### B. Notificaciones
- **Detalle:** Feedback visual (Toasts) más robusto para acciones de éxito/error (ej. "Paciente guardado con éxito" o alertas de choque de horarios).

---

## 📋 Plan de Acción Sugerido

1.  **Fase de Conexión:** Terminar el `submit` de la Historia Clínica a Supabase.
2.  **Fase de Archivos:** Implementar subida de imágenes para Radiografías.
3.  **Fase Financiera:** Crear una tabla simple de `treatments` (precios) y conectar al Odontograma.
4.  **Fase de Dashboard:** Llenar la pantalla de inicio con contadores reales.
