import React, { useState, useEffect } from 'react';
import {
    Plus, ShoppingCart, Edit2, Trash2, AlertTriangle, Package
} from 'lucide-react';
import { inventoryApi } from '../lib/supabase';
import ProductModal from '../components/finance/ProductModal';
import PurchaseModal from '../components/finance/PurchaseModal';
import styles from './FinancePage.module.css'; // Reusing styles for consistency

const InventoryPage = () => {
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [editingProduct, setEditingProduct] = useState(null);

    // -- MODALS --
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

    // Initial Load
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await inventoryApi.getProducts();
            setProducts(data);
        } catch (error) {
            console.error('Error loading inventory data:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- HANDLERS ---
    const handleOpenCreateProduct = () => {
        setEditingProduct(null);
        setIsProductModalOpen(true);
    };

    const handleEditProduct = (product) => {
        setEditingProduct(product);
        setIsProductModalOpen(true);
    };

    const handleSaveProduct = async () => {
        loadData();
    };

    const handleSavePurchase = async () => {
        loadData(); // Updates stock
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN'
        }).format(amount || 0);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.title}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '10px', background: '#eff6ff', borderRadius: '12px', color: '#3b82f6' }}>
                            <ShoppingCart size={24} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0 }}>Inventario / Kardex</h2>
                            <p style={{ margin: 0, opacity: 0.7 }}>Control logístico de stock y productos.</p>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className={styles.secondaryButton} onClick={() => setIsPurchaseModalOpen(true)}>
                        <Package size={18} /> Registrar Compra
                    </button>
                    <button className={styles.addButton} onClick={handleOpenCreateProduct}>
                        <Plus size={18} /> Nuevo Producto
                    </button>
                </div>
            </header>

            <div className={styles.contentArea}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Cargando inventario...</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                        {/* Summary Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                            <div className={styles.kpiCard}>
                                <span className={styles.kpiLabel}>Total Productos</span>
                                <div className={styles.kpiValue} style={{ color: '#3b82f6' }}>{products.length}</div>
                            </div>
                            <div className={styles.kpiCard}>
                                <span className={styles.kpiLabel}>Valor del Inventario</span>
                                <div className={styles.kpiValue} style={{ color: '#10b981' }}>
                                    {formatCurrency(products.reduce((acc, p) => acc + (p.cost * p.stock), 0))}
                                </div>
                            </div>
                            <div className={styles.kpiCard}>
                                <span className={styles.kpiLabel}>Items Bajos en Stock</span>
                                <div className={styles.kpiValue} style={{ color: '#f59e0b' }}>
                                    {products.filter(p => p.stock <= p.min_stock).length}
                                </div>
                            </div>
                        </div>

                        {/* Low Stock Alert */}
                        {products.some(p => p.stock <= p.min_stock) && (
                            <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', padding: '16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <AlertTriangle size={20} color="#f59e0b" />
                                <span style={{ color: '#92400e', fontWeight: 500 }}>
                                    Atención: Hay {products.filter(p => p.stock <= p.min_stock).length} productos con stock bajo. Revisa el listado.
                                </span>
                            </div>
                        )}

                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th>SKU/Código</th>
                                        <th>Categoría</th>
                                        <th style={{ textAlign: 'center' }}>Stock</th>
                                        <th style={{ textAlign: 'right' }}>Costo Unit.</th>
                                        <th style={{ textAlign: 'right' }}>Valor Total</th>
                                        <th style={{ textAlign: 'center' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.length > 0 ? (
                                        products.map(product => (
                                            <tr key={product.id}>
                                                <td style={{ fontWeight: 600, color: '#334155' }}>{product.name}</td>
                                                <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{product.sku || '-'}</td>
                                                <td>
                                                    <span className={styles.categoryBadge}>{product.category || 'General'}</span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span
                                                        style={{
                                                            padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600,
                                                            background: product.stock <= product.min_stock ? '#fef2f2' : '#f0fdf4',
                                                            color: product.stock <= product.min_stock ? '#ef4444' : '#15803d'
                                                        }}
                                                    >
                                                        {product.stock} {product.unit}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>{formatCurrency(product.cost)}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                                    {formatCurrency(product.cost * product.stock)}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => handleEditProduct(product)}
                                                        className={styles.iconBtn}
                                                        title="Editar"
                                                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No hay productos registrados.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <ProductModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                onSave={handleSaveProduct}
                product={editingProduct}
            />

            <PurchaseModal
                isOpen={isPurchaseModalOpen}
                onClose={() => setIsPurchaseModalOpen(false)}
                onSave={handleSavePurchase}
                products={products}
            />
        </div>
    );
};

export default InventoryPage;
