# Plan: Acceso a Detalles de Gastos Operativos

## Contexto y Diagnóstico
Actualmente, el sistema **sí cuenta con una página de detalle de gastos** completa (`ExpensesPage.jsx` en la ruta `/gastos`), la cual ya tiene la inteligencia para filtrar "Mis Gastos" vs "Gastos Globales" dependiendo del rol.

Sin embargo, hay dos razones por las cuales doctores como Luciana no pueden acceder a ella:
1. La ruta `/gastos` tiene un candado estricto de administrador (`requireAdmin`).
2. La tarjeta de "Gastos Operativos" en la página principal de finanzas no tiene un enlace activo al darle clic (como sí lo tiene la tarjeta de Ingresos Reales).

## Proposed Changes

### Componentes de React

#### [MODIFY] [router.jsx](file:///Users/stefanopatronisalazar/Documents/Antigravity/Curae%20Online/src/router.jsx)
- **Cambio:** Retirar la restricción `requireAdmin` de la ruta `/gastos`.
- **Razón:** Permitir que doctores no administradores puedan ingresar a la vista, donde el propio componente se encargará de mostrarles únicamente sus propios gastos.

#### [MODIFY] [FinancePage.jsx](file:///Users/stefanopatronisalazar/Documents/Antigravity/Curae%20Online/src/pages/FinancePage.jsx)
- **Cambio:** Añadir el evento `onClick` a la tarjeta (`KpiCard`) de **Gastos Operativos**.
- **Razón:** Permitir que los doctores, al darle clic a la tarjeta, sean redirigidos directamente a la ruta `/gastos` al igual que hacen con "Ingresos Reales".

## Verification Plan
### Manual Verification
- Iniciar sesión como Luciana Pacheco (No Admin).
- Navegar a Finanzas.
- Dar clic en la tarjeta "Gastos Operativos".
- Verificar que ingrese exitosamente a la vista `/gastos`.
- Confirmar que el título sea "Mis Gastos 💸" y solo muestre los gastos donde ella esté asignada, impidiendo que vea los gastos globales de la clínica.
