import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { expensesApi } from '../../lib/supabase';
import styles from './ExpenseModal.module.css';

const ExpenseModal = ({ isOpen, onClose, onSave, expense, defaultType = 'VARIABLE' }) => {
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        category: '',
        supplier: '',
        payment_method: 'Efectivo',
        status: 'pagado',
        description: '',
        notes: '',
        type: defaultType
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchCats = async () => {
            try {
                const cats = await expensesApi.getCategories();
                setCategories(cats);
            } catch (err) {
                console.error('Error fetching categories:', err);
            }
        };
        if (isOpen) {
            fetchCats();

            if (expense) {
                setFormData({
                    ...expense,
                    date: expense.date || new Date().toISOString().split('T')[0]
                });
            } else {
                setFormData({
                    date: new Date().toISOString().split('T')[0],
                    amount: '',
                    category: '',
                    supplier: '',
                    payment_method: 'Efectivo',
                    status: 'pagado',
                    description: '',
                    notes: '',
                    type: defaultType
                });
            }
        }
    }, [isOpen, expense, defaultType]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            alert('Error al guardar gasto: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <header className={styles.header}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className={styles.expenseType}>
                            {formData.type === 'INVENTARIO' ? 'Inventario' : (formData.type === 'FIJO' ? 'Gasto Fijo' : 'Gasto Variable')}
                        </span>
                        <h2>{expense ? 'Editar Gasto' : 'Nuevo Gasto'}</h2>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </header>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Fecha</label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Monto</label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                placeholder="0.00"
                                required
                                min="0"
                                step="0.01"
                                className={styles.input}
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Categoría</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                            className={styles.select}
                        >
                            <option value="">Seleccionar Categoría...</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Proveedor</label>
                        <input
                            type="text"
                            name="supplier"
                            value={formData.supplier}
                            onChange={handleChange}
                            placeholder="Ej. Enel"
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Tipología</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className={styles.select}
                            >
                                <option value="VARIABLE">Gasto Variable</option>
                                <option value="FIJO">Gasto Fijo</option>
                                <option value="INVENTARIO">Inventario</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Método de Pago</label>
                            <select
                                name="payment_method"
                                value={formData.payment_method}
                                onChange={handleChange}
                                className={styles.select}
                            >
                                <option value="Efectivo">Efectivo</option>
                                <option value="Transferencia">Transferencia</option>
                                <option value="Tarjeta">Tarjeta</option>
                                <option value="Yape/Plin">Yape/Plin</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Estado</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className={styles.select}
                                style={{
                                    color: formData.status === 'pagado' ? '#10b981' : '#f59e0b',
                                    fontWeight: '500'
                                }}
                            >
                                <option value="pagado">Pagado</option>
                                <option value="pendiente">Pendiente</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Descripción</label>
                        <input
                            type="text"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Notas Adicionales</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            className={`${styles.input} ${styles.textarea}`}
                        />
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

export default ExpenseModal;
