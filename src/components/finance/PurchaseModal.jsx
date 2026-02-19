import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { inventoryApi, purchasesApi } from '../../lib/supabase';
import styles from './PurchaseModal.module.css';

const PurchaseModal = ({ isOpen, onClose, onSave }) => {
    const [products, setProducts] = useState([]);
    const [header, setHeader] = useState({
        supplier: '',
        date: new Date().toISOString().split('T')[0],
        status: 'pendiente',
        notes: ''
    });
    const [items, setItems] = useState([
        { product_id: '', quantity: 1, unit_cost: 0, subtotal: 0 }
    ]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchProds = async () => {
            try {
                const data = await inventoryApi.getProducts();
                setProducts(data);
            } catch (error) {
                console.error('Error fetching products:', error);
            }
        };
        if (isOpen) fetchProds();
    }, [isOpen]);

    const handleHeaderChange = (e) => {
        const { name, value } = e.target;
        setHeader(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;

        // Recalculate subtotal
        if (field === 'quantity' || field === 'unit_cost') {
            const qty = parseFloat(newItems[index].quantity) || 0;
            const cost = parseFloat(newItems[index].unit_cost) || 0;
            newItems[index].subtotal = qty * cost;
        }

        // Calculate unit cost from product cost if product changes
        if (field === 'product_id') {
            const prod = products.find(p => p.id === value);
            if (prod) {
                newItems[index].unit_cost = prod.cost;
                newItems[index].subtotal = (newItems[index].quantity || 0) * prod.cost;
            }
        }

        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { product_id: '', quantity: 1, unit_cost: 0, subtotal: 0 }]);
    };

    const removeItem = (index) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (parseFloat(item.subtotal) || 0), 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const total = calculateTotal();
            const purchaseData = {
                ...header,
                total
            };

            // Filter invalid items
            const validItems = items.filter(i => i.product_id && i.quantity > 0);

            if (validItems.length === 0) {
                alert('Debe agregar al menos un producto válido.');
                setLoading(false);
                return;
            }

            await purchasesApi.create(purchaseData, validItems);
            onSave();
            onClose();
        } catch (error) {
            alert('Error al guardar compra: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <header className={styles.header}>
                    <h2>Nueva Compra de Inventario</h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </header>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Proveedor</label>
                            <input
                                type="text"
                                name="supplier"
                                value={header.supplier}
                                onChange={handleHeaderChange}
                                required
                                className={styles.input}
                                placeholder="Nombre del proveedor"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Fecha</label>
                            <input
                                type="date"
                                name="date"
                                value={header.date}
                                onChange={handleHeaderChange}
                                required
                                className={styles.input}
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Estado</label>
                        <select
                            name="status"
                            value={header.status}
                            onChange={handleHeaderChange}
                            className={styles.select}
                        >
                            <option value="pendiente">Pendiente (Borrador)</option>
                            <option value="pagada">Pagada (Actualiza Stock y Caja)</option>
                        </select>
                        <small style={{ color: '#64748b', fontSize: '0.75rem' }}>
                            Al marcar como "Pagada", se creará un egreso y se sumará el stock automáticamente.
                        </small>
                    </div>

                    <div className={styles.itemsContainer}>
                        <div className={styles.itemsHeader}>
                            <h4>Productos</h4>
                            <button type="button" onClick={addItem} className={styles.addItemBtn}>
                                <Plus size={14} /> Agregar Producto
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                            <span style={{ flex: 2 }}>Producto</span>
                            <span style={{ flex: 0.5 }}>Cant.</span>
                            <span style={{ flex: 0.8 }}>Costo Unit.</span>
                            <span style={{ flex: 0.8 }}>Subtotal</span>
                            <span style={{ width: '24px' }}></span>
                        </div>

                        {items.map((item, index) => (
                            <div key={index} className={styles.itemRow}>
                                <select
                                    value={item.product_id}
                                    onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                                    style={{ flex: 2 }}
                                    required
                                >
                                    <option value="">Seleccionar...</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                    style={{ flex: 0.5 }}
                                    required
                                />
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.unit_cost}
                                    onChange={(e) => handleItemChange(index, 'unit_cost', e.target.value)}
                                    style={{ flex: 0.8 }}
                                    required
                                />
                                <span style={{ flex: 0.8, textAlign: 'right', fontWeight: 500 }}>
                                    S/ {item.subtotal.toFixed(2)}
                                </span>
                                <button type="button" onClick={() => removeItem(index)} className={styles.removeItemBtn}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}

                        <div className={styles.totalSection}>
                            <span>Total Compra:</span>
                            <span className={styles.totalAmount}>S/ {calculateTotal().toFixed(2)}</span>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Notas</label>
                        <input
                            type="text"
                            name="notes"
                            value={header.notes}
                            onChange={handleHeaderChange}
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>
                            Cancelar
                        </button>
                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? 'Guardando...' : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Save size={18} /> Guardar Compra
                                </div>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PurchaseModal;
