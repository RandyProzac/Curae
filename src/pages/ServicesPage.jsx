import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Edit2, ChevronDown, ChevronUp, Package } from 'lucide-react';
import { servicesApi } from '../lib/supabase';
import styles from '../components/services/ServicesPage.module.css';

// Category Icons Map
const CATEGORY_ICONS = {
    'Odontología General': '🦷',
    'Odontología Restauradora': '🔧',
    'Endodoncia': '⚡',
    'Periodoncia': '🩸',
    'Cirugía Oral': '🔪',
    'Rehabilitación Oral': '👑',
    'Implantología': '🔩',
    'Ortodoncia': '😬',
    'Estética Dental': '💎',
    'Odontopediatría': '🧸',
    'Sin Categoría': '📦'
};

const CATEGORIES_LIST = Object.keys(CATEGORY_ICONS).filter(c => c !== 'Sin Categoría');

const ServicesPage = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategories, setExpandedCategories] = useState({});

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        category: 'Odontología General',
        description: '',
        price: '',
        duration_min: 30
    });

    // Fetch Services
    const fetchServices = async () => {
        try {
            setLoading(true);
            const data = await servicesApi.getAll();
            setServices(data);

            // Collapsed by default
            setExpandedCategories({});

        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    // Helper: Toggle Category
    const toggleCategory = (cat) => {
        setExpandedCategories(prev => ({
            ...prev,
            [cat]: !prev[cat]
        }));
    };

    // Helper: Filter & Group
    const getFilteredGroupedServices = () => {
        const filtered = services.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.category?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const grouped = filtered.reduce((acc, service) => {
            const cat = service.category || 'Sin Categoría';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(service);
            return acc;
        }, {});

        return grouped;
    };

    // Handlers
    const handleOpenCreate = () => {
        setEditingService(null);
        setFormData({
            name: '',
            category: 'Odontología General',
            description: '',
            price: '',
            duration_min: 30
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (service) => {
        setEditingService(service);
        setFormData({
            name: service.name,
            category: service.category || 'Odontología General',
            description: service.description || '',
            price: service.price,
            duration_min: service.duration_min || 30
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este servicio?')) return;
        try {
            await servicesApi.delete(id);
            setServices(prev => prev.filter(s => s.id !== id));
        } catch (error) {
            alert('Error al eliminar servicio: ' + error.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name,
                category: formData.category,
                description: formData.description,
                price: parseFloat(formData.price),
                duration_min: parseInt(formData.duration_min)
            };

            if (editingService) {
                const updated = await servicesApi.update(editingService.id, payload);
                setServices(prev => prev.map(s => s.id === updated.id ? updated : s));
            } else {
                const created = await servicesApi.create(payload);
                setServices(prev => [...prev, created]);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
            alert('Error al guardar servicio: ' + error.message);
        }
    };

    const groupedServices = getFilteredGroupedServices();

    return (
        <div className={styles.container}>
            <header className={styles.contentHeader}>
                <div className={styles.headerTitle}>
                    <h3>Catálogo de Servicios</h3>
                    <p>Gestiona precios, descripciones y categorías de tus tratamientos</p>
                </div>
                <button className={styles.addButton} onClick={handleOpenCreate}>
                    <Plus size={18} />
                    <span>Nuevo Servicio</span>
                </button>
            </header>

            <div className={styles.controls}>
                <div className={styles.searchBar}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Buscar servicio o categoría..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.input}
                        style={{ paddingLeft: '40px', width: '100%' }}
                    />
                </div>
            </div>

            <div className={styles.catalogContainer}>
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Cargando catálogo...</div>
                ) : Object.keys(groupedServices).length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No se encontraron servicios.</div>
                ) : (
                    Object.entries(groupedServices).map(([category, items]) => (
                        <div key={category} className={styles.categorySection}>
                            <div
                                className={`${styles.categoryHeader} ${expandedCategories[category] ? styles.expanded : ''}`}
                                onClick={() => toggleCategory(category)}
                            >
                                <div className={styles.categoryTitle}>
                                    <span style={{ fontSize: '20px' }}>{CATEGORY_ICONS[category] || '📦'}</span>
                                    <span>{category}</span>
                                    <span className={styles.itemCount}>{items.length} servicios</span>
                                </div>
                                {expandedCategories[category] ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
                            </div>

                            {expandedCategories[category] && (
                                <table className={styles.servicesTable}>
                                    <tbody>
                                        {items.map(service => (
                                            <tr key={service.id}>
                                                <td width="40%">
                                                    <div className={styles.serviceName}>{service.name}</div>
                                                    <span className={styles.serviceDesc}>{service.description}</span>
                                                </td>
                                                <td width="20%">
                                                    <div className={styles.serviceDuration}>
                                                        ⏱ {service.duration_min} min
                                                    </div>
                                                </td>
                                                <td width="20%">
                                                    <div className={styles.servicePrice}>
                                                        S/ {service.price.toFixed(2)}
                                                    </div>
                                                </td>
                                                <td width="20%">
                                                    <div className={styles.actions}>
                                                        <button
                                                            className={styles.actionBtn}
                                                            onClick={() => handleOpenEdit(service)}
                                                            title="Editar"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            className={`${styles.actionBtn} ${styles.delete}`}
                                                            onClick={() => handleDelete(service.id)}
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* CREATE / EDIT MODAL */}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>{editingService ? 'Editar Servicio' : 'Nuevo Servicio'}</h2>
                            <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className={styles.modalBody}>
                                <div className={styles.formGroup}>
                                    <label>Nombre del Servicio</label>
                                    <input
                                        required
                                        className={styles.input}
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ej: Profilaxis profunda"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Categoría</label>
                                    <select
                                        className={styles.select}
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        {CATEGORIES_LIST.map(cat => (
                                            <option key={cat} value={cat}>{CATEGORY_ICONS[cat]} {cat}</option>
                                        ))}
                                        <option value="Sin Categoría">📦 Sin Categoría</option>
                                    </select>
                                </div>

                                <div className={styles.formGroup}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <label>Precio Base (S/)</label>
                                            <input
                                                required
                                                type="number" step="0.01" min="0"
                                                className={styles.input}
                                                value={formData.price}
                                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div>
                                            <label>Duración (min)</label>
                                            <select
                                                className={styles.select}
                                                value={formData.duration_min}
                                                onChange={e => setFormData({ ...formData, duration_min: e.target.value })}
                                            >
                                                <option value="15">15 min</option>
                                                <option value="30">30 min</option>
                                                <option value="45">45 min</option>
                                                <option value="60">1 hora</option>
                                                <option value="90">1h 30m</option>
                                                <option value="120">2 horas</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Descripción</label>
                                    <textarea
                                        className={styles.textarea}
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Detalles sobre el procedimiento..."
                                    />
                                </div>
                            </div>
                            <div className={styles.modalFooter}>
                                <button type="button" className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>Cancelar</button>
                                <button type="submit" className={styles.saveBtn}>Guardar Servicio</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServicesPage;
