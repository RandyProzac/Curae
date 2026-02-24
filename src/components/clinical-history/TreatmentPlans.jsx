import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Calendar,
    FileText,
    ChevronDown,
    ChevronRight,
    Image as ImageIcon,
    Camera,
    DollarSign,
    CheckCircle,
    Trash2,
    Activity
} from 'lucide-react';
import Odontograma from '../odontogram/Odontograma';
import BudgetDetails from './BudgetDetails';
import PlanGallery from './PlanGallery';
import styles from './ClinicalHistory.module.css';

// Simple helper to format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN'
    }).format(amount || 0);
};

export default function TreatmentPlans({ patientId, patientName, patientPhone, onUpdate }) {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedPlanId, setExpandedPlanId] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ open: false, planId: null, title: '' });

    const [errorMsg, setErrorMsg] = useState(null);

    useEffect(() => {
        if (patientId) {
            fetchPlans();
        }
    }, [patientId]);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            setErrorMsg(null);

            console.log("Fetching plans for patient:", patientId);

            const { data, error } = await supabase
                .from('treatment_plans')
                .select(`
                    id, 
                    title, 
                    created_at, 
                    status, 
                    notes, 
                    odontogram_data,
                    budget:budgets (
                        id,
                        created_at,
                        title,
                        status,
                        discount, 
                        items:budget_items (
                            id,
                            service_name,
                            tooth_number,
                            unit_price,
                            quantity,
                            discount,
                            discount_type,
                            paid_amount,
                            payments (
                                id,
                                amount,
                                created_at
                            )
                        )
                    )
                `)
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Supabase Error:", error);
                throw error;
            }

            console.log("Plans fetched:", data);
            setPlans(data || []);
        } catch (error) {
            console.error('Error fetching treatment plans:', error);
            setErrorMsg(error.message || 'Error desconocido al cargar planes');
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (id) => {
        setExpandedPlanId(expandedPlanId === id ? null : id);
    };

    const handleStatusChange = async (planId, newStatus) => {
        try {
            const { error } = await supabase
                .from('treatment_plans')
                .update({ status: newStatus })
                .eq('id', planId);

            if (error) throw error;
            await fetchPlans(); // Refresh list
            if (onUpdate) onUpdate(); // Sync sidebar header after change
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Error al cambiar estado');
        }
    };

    const handleDeletePlan = async () => {
        if (!deleteModal.planId) return;
        try {
            const { error } = await supabase
                .from('treatment_plans')
                .delete()
                .eq('id', deleteModal.planId);

            if (error) throw error;

            // Also close details if deleted plan was open
            if (expandedPlanId === deleteModal.planId) setExpandedPlanId(null);

            setDeleteModal({ open: false, planId: null, title: '' });
            await fetchPlans(); // Refresh list
            if (onUpdate) onUpdate(); // Sync sidebar header
        } catch (err) {
            console.error('Error deleting plan:', err);
            alert('Error al eliminar el plan de tratamiento');
        }
    };

    if (loading) return <div className={styles.loading}>Cargando planes de tratamiento...</div>;

    if (errorMsg) return (
        <div className={styles.errorState} style={{ padding: '20px', color: '#ef4444', background: '#fef2f2', borderRadius: '8px' }}>
            <h3>Error al cargar planes</h3>
            <p>{errorMsg}</p>
            <button onClick={fetchPlans} style={{ marginTop: '10px', padding: '5px 10px', cursor: 'pointer' }}>Reintentar</button>
        </div>
    );

    if (plans.length === 0) {
        return (
            <div className={styles.emptyState}>
                <FileText size={48} color="#cbd5e1" />
                <h3>No hay planes de tratamiento registrados</h3>
                <p>Los planes de tratamiento se crean desde la pestaña de Odontograma al guardar un nuevo estado.</p>
            </div>
        );
    }

    return (
        <div className={styles.treatmentPlansContainer}>
            {plans.map((plan) => {
                // Calculate total budget if available (simple sum of items)
                // Note: The query above returns budget_items, we need to sum them up manually or adjust the query.
                // For simplicity, let's assume we can sum it here.
                let totalBudget = 0;
                if (plan.budget?.items) {
                    totalBudget = plan.budget.items.reduce((acc, item) => {
                        const rawItem = (item.unit_price * item.quantity);
                        const discountVal = parseFloat(item.discount || 0);
                        const itemDiscount = (item.discount_type === 'percent')
                            ? (rawItem * discountVal / 100) : discountVal;
                        return acc + (rawItem - itemDiscount);
                    }, 0);
                }

                return (
                    <div key={plan.id} className={styles.planCard}>
                        <div className={styles.planHeader} onClick={() => toggleExpand(plan.id)}>
                            <div className={styles.planTitleRow}>
                                <button className={styles.expandBtn}>
                                    {expandedPlanId === plan.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                </button>
                                <div className={styles.planInfo}>
                                    <h4 className={styles.planTitle}>{plan.title}</h4>
                                    <span className={styles.planDate}>
                                        <Calendar size={14} />
                                        {new Date(plan.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className={styles.planMeta}>
                                    {totalBudget > 0 && (
                                        <span className={styles.planBudget}>
                                            {formatCurrency(totalBudget)}
                                        </span>
                                    )}
                                    {/* STATUS SELECTOR */}
                                    <div className={styles.statusSelectContainer} onClick={(e) => e.stopPropagation()}>
                                        <select
                                            value={plan.status}
                                            onChange={(e) => handleStatusChange(plan.id, e.target.value)}
                                            className={`${styles.statusSelect} ${plan.status === 'active'
                                                ? styles.statusSelectActive
                                                : (plan.status === 'completed'
                                                    ? styles.statusSelectCompleted
                                                    : styles.statusSelectArchived)
                                                }`}
                                        >
                                            <option value="active">ACTIVO</option>
                                            <option value="completed">TERMINADO</option>
                                            <option value="archived">INCONCLUSO</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.location.href = `/planes/${plan.id}/evolucion`;
                                        }}
                                        className={styles.evolutionBtn}
                                        title="Ver Evolución"
                                    >
                                        <Activity size={16} />
                                        Evolución
                                    </button>
                                    <button
                                        className={styles.deletePlanBtn}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteModal({ open: true, planId: plan.id, title: plan.title });
                                        }}
                                        title="Eliminar plan"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {expandedPlanId === plan.id && (
                            <div className={styles.planDetails}>
                                <div className={styles.detailGrid} style={{ gridTemplateColumns: '1fr' }}>
                                    {/* Odontogram Snapshot - Full Width */}
                                    <div className={styles.detailSection}>
                                        <h5><ImageIcon size={16} /> Odontograma (Solo Lectura)</h5>
                                        <div style={{
                                            background: 'white',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0',
                                            padding: '24px',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            overflowX: 'auto'
                                        }}>
                                            <div style={{ width: '100%', minWidth: '900px' }}>
                                                <Odontograma
                                                    data={plan.odontogram_data || {}}
                                                    selectedTool={null}
                                                    onToothClick={() => { }}
                                                    onSurfaceClick={() => { }}
                                                    onSpecificationsChange={() => { }}
                                                    selectedTooth={null}
                                                    showSpecifications={false}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div className={styles.detailSection}>
                                        <h5><FileText size={16} /> Notas</h5>
                                        <p className={styles.notesText}>{plan.notes || 'Sin notas.'}</p>
                                    </div>

                                    {/* Budget Details - Uses the new component */}
                                    {plan.budget && (
                                        <div className={styles.detailSection}>
                                            <h5><DollarSign size={16} /> Presupuesto y Pagos</h5>
                                            <BudgetDetails
                                                budget={plan.budget}
                                                patientId={patientId}
                                                patientName={patientName}
                                                patientPhone={patientPhone}
                                                planTitle={plan.title}
                                                onUpdate={async () => {
                                                    await fetchPlans(); // Refresh local plan data
                                                    if (onUpdate) onUpdate(); // Refresh parent sidebar header
                                                }}
                                            />
                                        </div>
                                    )}

                                    {/* Fotos del Plan - última sección */}
                                    <div className={styles.detailSection}>
                                        <h5><Camera size={16} /> Imágenes del Plan</h5>
                                        <PlanGallery planId={plan.id} patientId={patientId} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
            {/* Delete Confirmation Modal */}
            {deleteModal.open && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: 'white', borderRadius: '12px', width: '400px', maxWidth: '90%',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        overflow: 'hidden'
                    }}>
                        <div style={{ padding: '24px' }}>
                            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                                Eliminar Plan de Tratamiento
                            </h3>
                            <p style={{ margin: 0, color: '#4b5563', fontSize: '14px', lineHeight: '1.5' }}>
                                ¿Estás seguro que deseas eliminar el plan <strong>"{deleteModal.title}"</strong>?
                                Esta acción también eliminará el presupuesto y los pagos asociados.
                                Esta acción no se puede deshacer.
                            </p>
                        </div>
                        <div style={{
                            background: '#f9fafb', padding: '16px 24px',
                            display: 'flex', justifyContent: 'flex-end', gap: '12px',
                            borderTop: '1px solid #e5e7eb'
                        }}>
                            <button
                                onClick={() => setDeleteModal({ open: false, planId: null, title: '' })}
                                style={{
                                    padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: '500',
                                    border: '1px solid #d1d5db', background: 'white', color: '#374151', cursor: 'pointer'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeletePlan}
                                style={{
                                    padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: '500',
                                    border: 'none', background: '#dc2626', color: 'white', cursor: 'pointer'
                                }}
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
