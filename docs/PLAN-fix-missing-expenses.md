# Plan: Sincronización de Gastos de Laboratorio

## Contexto y Diagnóstico
He analizado a fondo la base de datos y el código respecto al gasto de S/ 600 del laboratorio de la Dra. Luciana Pacheco.

**¡Buenas noticias sobre los S/ 600!**
El gasto **SÍ** está registrado y **SÍ** se está sumando en las finanzas. 
Si miras tu captura de pantalla de "Mis Gastos", el "Total Gastos" dice **S/ 2,585.02**. Si sumas los montos visibles (100.02 + 85 + 900 + 900), da S/ 1,985.02. Si le sumas los 600 faltantes, da exactamente S/ 2,585.02.
¿Por qué no lo ves? Porque la lista está ordenada por fecha (del más reciente al más antiguo). Los visibles son de fines de mayo (30, 27, 24). El trabajo de S/ 600 fue enviado el **8 de mayo** (08/05/2026), por lo que está en la fila número 5, justo debajo de donde se corta tu pantalla.

**El problema visual:**
El contenedor de la página tiene una regla en el código (`height: 100%`) que a veces "corta" la tabla visualmente en pantallas de laptop sin mostrar la barra de desplazamiento correctamente, haciendo parecer que ahí termina la lista.

**El problema real (Trabajos antiguos):**
Para responder a tu pregunta de si hay *otros* gastos que no se estén pasando: He corrido un rastreo en la base de datos y descubrí que hay **5 trabajos de laboratorio antiguos** (todos del 21 de Abril de 2026) que tienen un costo asignado pero NO generaron un gasto en finanzas. Esto ocurrió porque esos trabajos se registraron *antes* de que tuviéramos la lógica de automatización de gastos.

## Proposed Changes

### 1. Corrección Visual (CSS)
#### [MODIFY] [ExpensesPage.module.css](file:///Users/stefanopatronisalazar/Documents/Antigravity/Curae%20Online/src/pages/ExpensesPage.module.css)
- **Cambio:** Cambiar `height: 100%` a `min-height: 100%` y agregar comportamiento de scroll a la tabla.
- **Razón:** Asegurar que si hay más elementos de los que caben en la pantalla, la tabla muestre un scroll claro para que ningún gasto quede oculto "debajo" del monitor.

### 2. Sincronización de Base de Datos (Backfill)
- **Cambio:** Ejecutar un script para insertar automáticamente en `expenses` los 5 trabajos de laboratorio antiguos (del 21 de Abril) que no estaban sincronizados.
- **Razón:** Regularizar las finanzas pasadas para que cuadren perfectamente.

## Verification Plan
1. Ingresar a "Mis Gastos" como Luciana Pacheco.
2. Hacer scroll en la tabla y verificar que el gasto de 600 soles del 8 de Mayo es ahora fácilmente visible.
3. Cambiar el filtro de fecha a Abril de 2026 y comprobar que los 5 trabajos antiguos (puentes, carillas, coronas) ya aparecen correctamente en Finanzas.
