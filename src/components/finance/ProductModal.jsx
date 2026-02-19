import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { inventoryApi } from '../../lib/supabase';
import styles from './ProductModal.module.css';

const ProductModal = ({ isOpen, onClose, onSave, product }) => {
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        unit: 'unidad',
        cost: '',
        stock: 0,
        min_stock: 5,
        category: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (product) {
            setFormData(product);
        } else {
            setFormData({
                name: '',
                sku: '',
                unit: 'unidad',
                cost: '',
                stock: 0,
                min_stock: 5,
                category: ''
            });
        }
    }, [product, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (product) {
                await inventoryApi.updateProduct(product.id, formData);
            } else {
                await inventoryApi.createProduct(formData);
            }
            onSave();
            onClose();
        } catch (error) {
            alert('Error al guardar producto: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <header className={styles.header}>
                    <h2>{product ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </header>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>Nombre del Producto</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className={styles.input}
                            placeholder="Ej. Resina Compuesta 3M"
                        />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>SKU / Código</label>
                            <input
                                type="text"
                                name="sku"
                                value={formData.sku}
                                onChange={handleChange}
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Categoría</label>
                            <input
                                type="text"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className={styles.input}
                                placeholder="Ej. Restauración"
                            />
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Costo Unitario (S/)</label>
                            <input
                                type="number"
                                name="cost"
                                value={formData.cost}
                                onChange={handleChange}
                                step="0.01"
                                min="0"
                                required
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Unidad de Medida</label>
                            <select
                                name="unit"
                                value={formData.unit}
                                onChange={handleChange}
                                className={styles.select}
                            >
                                <option value="unidad">Unidad</option>
                                <option value="caja">Caja</option>
                                <option value="paquete">Paquete</option>
                                <option value="rollo">Rollo</option>
                                <option value="litro">Litro</option>
                                <option value="gramo">Gramo</option>
                                <option value="kit">Kit</option>
                                <option value="juego">Juego</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Stock Inicial</label>
                            <input
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                min="0"
                                required
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Stock Mínimo (Alerta)</label>
                            <input
                                type="number"
                                name="min_stock"
                                value={formData.min_stock}
                                onChange={handleChange}
                                min="0"
                                required
                                className={styles.input}
                            />
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>
                            Cancelar
                        </button>
                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? 'Guardando...' : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Save size={18} /> Guardar
                                </div>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductModal;
