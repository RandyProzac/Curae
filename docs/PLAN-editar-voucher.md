# Plan: Editar Vouchers de Pagos Realizados

## Objetivo
Permitir que el botón "✓ Pagado" de un tratamiento en el Presupuesto sea interactivo. Al hacer clic, debe abrir el modal de pagos con los datos del último cobro registrado, permitiendo al usuario corregir errores (como método de pago o monto). Al guardar, el sistema anulará internamente el pago anterior y generará uno nuevo, manteniendo las finanzas exactas.

> [!WARNING]
> ## 🛑 Puerta Socrática (Requiere tu validación)
> Antes de proceder con el código, necesito tu confirmación sobre este caso específico:
> 
> **¿Qué sucede si el "Voucher" que intentamos editar incluía múltiples tratamientos pagados al mismo tiempo?**  
> Si el paciente pagó 3 tratamientos juntos en un solo voucher (por ejemplo, con S/ 500 en efectivo) y te equivocas al cobrar. Luego haces clic en "Pagado" en **solo uno** de esos tratamientos para editarlo:
> 1. **Opción A:** ¿Se debe anular **todo el voucher completo** (los 3 tratamientos vuelven a estar pendientes) y se abre el modal para volver a cobrar los 3 juntos?
> 2. **Opción B:** ¿Se anula **solo la porción** del pago de ese único tratamiento, dejando los otros 2 como pagados, y generando un voucher nuevo solo por este?
> 
> *(Recomiendo la **Opción A** por simplicidad contable y evitar cuadres matemáticos complejos en Finanzas, ya que el voucher físico original decía "S/ 500 por 3 cosas").*

---

## Cambios Propuestos

### 1. Interfaz de Usuario (UI) en Presupuestos (`BudgetDetails.jsx`)
- Convertir la etiqueta `<span style={S.paidBadge}>✓ Pagado</span>` en un botón interactivo.
- Al hacer clic, buscar en la base de datos el último `voucher` asociado a ese `budget_item_id`.
- Abrir el `MultiPaymentModal` (o un nuevo `EditPaymentModal`) pre-cargado con los montos y métodos de pago (`Efectivo`, `VISA`, etc.) usados en ese voucher.

### 2. Lógica de Base de Datos (`supabase.js` - `vouchersApi`)
- Crear un nuevo método `vouchersApi.replace(...)` o `vouchersApi.delete(...)`.
- **Anulación (Rollback):**
  - Identificar el `voucher_id` original.
  - Restar el `amount_paid` de la columna `paid_amount` en los `budget_items` correspondientes.
  - Eliminar los registros en `payments` (para que desaparezcan de Finanzas).
  - Eliminar los `voucher_items`, `voucher_payment_methods` y finalmente el `vouchers` original.
- **Regeneración:**
  - Ejecutar la misma lógica de `vouchersApi.create(...)` para insertar el nuevo cobro con los valores corregidos.
  - Esto generará un nuevo `ticket_number` para mantener correlatividad contable.

### 3. Historial Clínico (Feedback Visual)
- Añadir un estado de `isEditingPayment` para mostrar un spinner mientras el sistema hace la doble operación de borrar y crear, asegurando que el usuario no haga doble clic.

---

## Plan de Verificación
### Pruebas Manuales
1. Crear un tratamiento de S/ 100.
2. Cobrarlo (se genera en finanzas).
3. Hacer clic en "Pagado", cambiar el monto o el método (ej. de VISA a Yape).
4. Verificar que en Finanzas el ingreso de VISA desaparece y aparece el de Yape.
5. Verificar que el total del presupuesto se mantenga coherente.
