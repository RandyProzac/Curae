import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, Image as ImageIcon } from 'lucide-react';
import EvolutionOdontogram from '../components/clinical-history/EvolutionOdontogram';
import EvolutionNotesPanel from '../components/clinical-history/EvolutionNotesPanel';
import { treatmentPlanApi } from '../lib/supabase';
import './TreatmentEvolutionPage.css'; // Import custom styles

export default function TreatmentEvolutionPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('odontogram'); // 'odontogram' | 'images'

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await treatmentPlanApi.getById(id);
            setPlan(data);
        } catch (error) {
            console.error('Error loading plan for evolution:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEvolution = async (newEvolutionData) => {
        if (!plan) return;
        try {
            await treatmentPlanApi.updateEvolution(plan.id, newEvolutionData);
            // Update local state to reflect changes immediately
            setPlan(prev => ({ ...prev, evolution_odontogram_data: newEvolutionData }));
        } catch (error) {
            console.error('Error updating evolution:', error);
            throw error; // Let child handle toast
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="error-container">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1f2937' }}>Plan no encontrado</h2>
                <button
                    onClick={() => navigate('/planes')}
                    className="back-link"
                >
                    Volver a Planes
                </button>
            </div>
        );
    }

    return (
        <div className="evolution-page">
            {/* Header */}
            <header className="evolution-header">
                <div className="header-left">
                    <button
                        onClick={() => navigate(-1)}
                        className="back-button"
                        title="Volver"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="header-title-area">
                        <h1>
                            <Activity color="#0d9488" size={24} />
                            Evolución del Tratamiento
                        </h1>
                        <p>
                            Plan: <span className="plan-name">{plan.title || 'Sin Título'}</span>
                        </p>
                    </div>
                </div>

                {/* Tabs / Actions */}
                <div className="header-tabs">
                    <button
                        onClick={() => setActiveTab('odontogram')}
                        className={`tab-button ${activeTab === 'odontogram' ? 'active' : ''}`}
                    >
                        Odontograma
                    </button>
                    <button
                        onClick={() => setActiveTab('images')}
                        className={`tab-button ${activeTab === 'images' ? 'active' : ''}`}
                    >
                        <ImageIcon size={16} />
                        Imágenes
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="evolution-content">

                {/* Left Panel: Visual (Odontogram or Images) */}
                <div className="visual-panel">
                    {activeTab === 'odontogram' ? (
                        <div className="odontogram-container custom-scrollbar">
                            <EvolutionOdontogram
                                planId={plan.id}
                                initialData={plan.odontogram_data}
                                evolutionData={plan.evolution_odontogram_data}
                                onSave={handleSaveEvolution}
                            />
                        </div>
                    ) : (
                        <div className="images-placeholder">
                            <ImageIcon size={48} opacity={0.5} />
                            <div style={{ fontWeight: 500, fontSize: '1.125rem' }}>Galería de Imágenes (Próximamente)</div>
                            <div style={{ fontSize: '0.875rem' }}>Aquí podrás subir fotos intraorales y extraorales.</div>
                        </div>
                    )}
                </div>

                {/* Right Panel: Notes (Fixed width) */}
                <div className="notes-panel-wrapper">
                    <EvolutionNotesPanel planId={plan.id} />
                </div>
            </main>
        </div>
    );
}
