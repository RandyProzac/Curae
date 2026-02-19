import React, { useState, useEffect } from 'react';
import { X, Search, DollarSign, RotateCcw, Save } from 'lucide-react';
import { servicesApi, patientBudgetApi } from '../../lib/supabase';
import styles from './PatientBudgetModal.module.css';

const PatientBudgetModal = ({ isOpen, onClose, patient }) => {
    const [services, setServices] = useState([]);
    const [customPrices, setCustomPrices] = useState({}); // { serviceId: { price, notes, originalId } }
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [saving, setSaving] = useState(null); // ID of service being saved

    // Load Data
    useEffect(() => {
        if (isOpen && patient?.id) {
            loadData();
        }
    }, [isOpen, patient]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [allServices, patientPrices] = await Promise.all([
                servicesApi.getAll(),
                patientBudgetApi.getPatientPrices(patient.id)
            ]);

            setServices(allServices);

            // Map custom prices
            const priceMap = {};
            patientPrices.forEach(p => {
                priceMap[p.service_id] = {
                    price: p.custom_price,
                    notes: p.notes,
                    id: p.id
                };
            });
            setCustomPrices(priceMap);
        } catch (error) {
            console.error('Error loading budget data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handlers
    const handlePriceChange = (serviceId, newVal) => {
        setCustomPrices(prev => ({
            ...prev,
            [serviceId]: {
                ...prev[serviceId],
                price: newVal
            }
        }));
    };

    const savePrice = async (serviceId, basePrice) => {
        const custom = customPrices[serviceId];
        if (!custom || !custom.price) return;

        // If price equals base price, maybe remove custom price? 
        // Or keep it explicit? Let's keep it explicit if user typed it.
        // Unless it's empty, then revert.

        const val = parseFloat(custom.price);
        if (isNaN(val)) return;

        setSaving(serviceId);
        try {
            await patientBudgetApi.upsertPrice(patient.id, serviceId, val);
            // Slight delay to show success state
            setTimeout(() => setSaving(null), 500);
        } catch (error) {
            console.error('Error saving price:', error);
            alert('Error al guardar precio');
            setSaving(null);
        }
    };

    const handleReset = async (serviceId) => {
        if (!customPrices[serviceId]) return;

        try {
            await patientBudgetApi.removePrice(patient.id, serviceId);
            setCustomPrices(prev => {
                const next = { ...prev };
                delete next[serviceId];
                return next;
            });
        } catch (error) {
            console.error('Error resetting price:', error);
        }
    };

    // Filtering & Grouping
    const filteredServices = services.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const grouped = filteredServices.reduce((acc, s) => {
        const cat = s.category || 'Sin Categoría';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(s);
        return acc;
    }, {});

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.title}>
                        <h2>Presupuesto Personalizado</h2>
                        <p>{patient?.name || 'Paciente'}</p>
                    </div>
                </div>

                <div className={styles.content}>
                    <div className={styles.searchBar}>
                        <Search className={styles.searchIcon} size={18} />
                        <input
                            className={styles.searchInput}
                            placeholder="Buscar servicio..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Cargando precios...</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {Object.entries(grouped).map(([category, items]) => (
                                <div key={category} className={styles.categoryGroup}>
                                    <div className={styles.categoryHeader}>
                                        {category}
                                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '400' }}>({items.length})</span>
                                    </div>
                                    <div>
                                        {items.map(service => {
                                            const custom = customPrices[service.service_id] || customPrices[service.id]; // Handle both keys if needed
                                            const hasCustom = !!customPrices[service.id];
                                            const currentPrice = hasCustom ? customPrices[service.id].price : '';

                                            // Calculate diff
                                            let diffBadge = null;
                                            if (hasCustom && currentPrice) {
                                                const diff = ((currentPrice - service.price) / service.price) * 100;
                                                const diffStr = Math.abs(diff).toFixed(0);
                                                if (diff < -0.1) {
                                                    diffBadge = <span className={`${styles.discountBadge} ${styles.discount}`}>-{diffStr}% Dcto</span>;
                                                } else if (diff > 0.1) {
                                                    diffBadge = <span className={`${styles.discountBadge} ${styles.surcharge}`}>+{diffStr}% Incr</span>;
                                                }
                                            }

                                            return (
                                                <div key={service.id} className={styles.serviceRow}>
                                                    <div className={styles.serviceName}>{service.name}</div>
                                                    <div className={styles.basePrice}>Base: S/ {service.price}</div>

                                                    <div style={{ position: 'relative' }}>
                                                        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '13px' }}>S/</span>
                                                        <input
                                                            type="number"
                                                            className={styles.priceInput}
                                                            style={{ paddingLeft: '30px', borderColor: hasCustom ? '#2563eb' : '' }}
                                                            placeholder={service.price}
                                                            value={currentPrice}
                                                            onChange={e => handlePriceChange(service.id, e.target.value)}
                                                            onBlur={() => savePrice(service.id, service.price)}
                                                            onKeyDown={e => e.key === 'Enter' && e.target.blur()}
                                                        />
                                                    </div>

                                                    <div style={{ textAlign: 'center' }}>
                                                        {diffBadge}
                                                        {saving === service.id && <span style={{ fontSize: '12px', color: '#10b981', marginLeft: '8px' }}>Guardado</span>}
                                                    </div>

                                                    <button
                                                        className={styles.resetBtn}
                                                        onClick={() => handleReset(service.id)}
                                                        title="Restaurar precio base"
                                                        style={{ visibility: hasCustom ? 'visible' : 'hidden' }}
                                                    >
                                                        <RotateCcw size={16} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.footer}>
                    <button onClick={onClose} style={{ padding: '10px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PatientBudgetModal;
