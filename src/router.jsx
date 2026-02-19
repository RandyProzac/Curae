import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/useAuth';
import LoginPage from './pages/LoginPage';
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import OdontogramPage from './pages/OdontogramPage';
import AppointmentsPage from './pages/AppointmentsPage';
import ClinicalHistoryPage from './pages/ClinicalHistoryPage';
import ServicesPage from './pages/ServicesPage';
import DoctorsPage from './pages/DoctorsPage';
import FinancePage from './pages/FinancePage';
import InventoryPage from './pages/InventoryPage';
import TreatmentEvolutionPage from './pages/TreatmentEvolutionPage';

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false }) => {
    const { user, loading, isAdmin } = useAuth();

    if (loading) {
        return (
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
                <p>Cargando portal...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (requireAdmin && !isAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
};

const AppRouter = () => {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <MainLayout />
                    </ProtectedRoute>
                }
            >
                {/* Dashboard Home */}
                <Route index element={<DashboardPage />} />

                {/* Modules */}
                <Route path="citas" element={<AppointmentsPage />} />
                <Route path="pacientes" element={<PatientsPage />} />
                <Route path="pacientes/:patientId/historia-clinica" element={<ClinicalHistoryPage />} />
                <Route path="servicios" element={<ServicesPage />} />
                <Route path="odontograma-test" element={<OdontogramPage />} />
                <Route path="inventario" element={<InventoryPage />} />
                <Route path="planes/:id/evolucion" element={<TreatmentEvolutionPage />} />

                {/* Placeholders */}
                <Route path="agenda" element={<div>Módulo Agenda (Próximamente)</div>} />
                <Route path="finanzas" element={<FinancePage />} />
                <Route path="doctores" element={<DoctorsPage />} />
                <Route path="configuracion" element={<div>Módulo Configuración (Próximamente)</div>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default AppRouter;
