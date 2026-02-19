# Curae Online - Sistema de Gestión Odontológica

Sistema completo de gestión para clínicas odontológicas desarrollado con React + Vite y Notion API.

## 🚀 Características

- **Gestión de Pacientes**: Fichas completas con datos personales, historial médico
- **Odontograma Interactivo**: Sistema FDI con codificación de colores (patologías y tratamientos)
- **Agenda de Citas**: Calendario integrado para gestión de citas
- **Control de Tratamientos**: Seguimiento de planes de tratamiento y presupuestos
- **Sistema de Roles**: Administrador y Doctor con permisos diferenciados
- **Documentos**: Upload de radiografías, recetas y consentimientos informados

## 📋 Requisitos Previos

- Node.js 18+ instalado
- Cuenta de Notion con API Key
- npm o yarn

## 🔧 Instalación

1. Clonar el repositorio o descargar el proyecto

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
```

4. Editar `.env` y agregar tu Notion API Key y Database IDs

5. Crear las bases de datos en Notion según la estructura definida

## 🏃 Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 📦 Build para Producción

```bash
npm run build
```

## 🏗️ Estructura del Proyecto

```
src/
├── api/              # Clientes API (Notion)
├── components/       # Componentes React
│   ├── auth/        # Autenticación
│   ├── dashboard/   # Dashboard principal
│   ├── patients/    # Módulo de pacientes
│   ├── odontogram/  # Odontograma interactivo
│   ├── calendar/    # Sistema de calendario
│   ├── reports/     # Reportes
│   ├── settings/    # Configuración
│   └── common/      # Componentes reutilizables
├── contexts/        # React Contexts
├── hooks/           # Custom Hooks
├── utils/           # Utilidades
└── styles/          # Estilos globales
```

## 📊 Bases de Datos en Notion

El sistema requiere 5 bases de datos en Notion:

1. **Pacientes**: Datos personales y médicos
2. **Odontogramas**: Estados dentales según FDI
3. **Citas**: Agenda de citas
4. **Tratamientos**: Planes y seguimiento
5. **Doctores**: Usuarios del sistema

## 🎨 Tecnologías

- **React 18**: Framework UI
- **Vite**: Build tool
- **React Router**: Navegación
- **Notion API**: Base de datos
- **Lucide React**: Iconos
- **CSS Modules**: Estilos

## 📝 Licencia

Propiedad privada - Uso exclusivo para la clínica

## 👨‍💻 Soporte

Para soporte técnico, contactar al administrador del sistema.
