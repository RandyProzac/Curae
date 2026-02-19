# Curae Online - Sistema de Gestión Odontológica (v2.0)

Sistema integral de gestión para clínicas odontológicas, desarrollado con **React** y potenciado por **Supabase**.

## 🚀 Características Principales

- **Pacientes**: Expedientes clínicos completos, antecedentes y control de evolución.
- **Odontograma Evolutivo**: Gráfico interactivo (FDI) para registrar hallazgos y tratamientos en tiempo real.
- **Agenda de Citas**: Calendario avanzado con filtros por doctor y estados.
- **Planes de Tratamiento**: Creación de presupuestos, fases clínicas y seguimiento de pagos.
- **Bitácora**: Notas de evolución con firma digital del profesional.
- **Dashboard**: Estadísticas financieras y operativas de la clínica.

## 🛠️ Stack Tecnológico

- **Frontend**: React 18 + Vite
- **Backend / DB**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Row Level Security)
- **Storage**: Supabase Storage (Imágenes y Docs)
- **UI**: CSS Modules, Lucide Icons, Recharts

## 📋 Requisitos Previos

- Node.js 18+
- Proyecto activo en [Supabase](https://supabase.com)

## 🔧 Instalación Local

1.  **Clonar el proyecto**
    ```bash
    git clone https://github.com/RandyProzac/Curae.git
    cd Curae
    ```

2.  **Instalar dependencias**
    ```bash
    npm install
    ```

3.  **Configurar Entorno**
    Crea un archivo `.env` basado en el ejemplo y añade tus credenciales:
    ```env
    VITE_SUPABASE_URL=tu_url_de_supabase
    VITE_SUPABASE_ANON_KEY=tu_clave_anonima
    ```

4.  **Iniciar Servidor de Desarrollo**
    ```bash
    npm run dev
    ```
    La app correrá en `http://localhost:5173`.

## 📦 Despliegue en Producción

Este proyecto está optimizado para desplegarse en **Vercel**:

1.  Importa este repositorio en Vercel.
2.  Añade las variables de entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) en la configuración del proyecto.
3.  ¡Deploy!

---
© 2026 Curae Online. Propiedad Privada.
