import React, { useState, useEffect } from 'react';
import {
    Plus, ShoppingCart, Edit2, Trash2, AlertTriangle, Package
} from 'lucide-react';
import { inventoryApi } from '../lib/supabase';
import ProductModal from '../components/finance/ProductModal';
import PurchaseModal from '../components/finance/PurchaseModal';
import styles from './InventoryPage.module.css';
import { Search } from 'lucide-react';

const InventoryPage = () => {
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

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

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN'
        }).format(amount || 0);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleGroup}>
                    <div className={styles.titleIcon}>
                        <ShoppingCart size={24} />
                    </div>
                    <div className={styles.titleText}>
                        <h2>Inventario / Kardex</h2>
                        <p>Control logístico de stock y productos.</p>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.secondaryButton} onClick={() => setIsPurchaseModalOpen(true)}>
                        <Package size={18} /> <span>Registrar Compra</span>
                    </button>
                    <button className={styles.addButton} onClick={handleOpenCreateProduct} id="btn-nuevo-producto">
                        <Plus size={18} /> <span>Nuevo Producto</span>
                    </button>
                </div>
            </header>

            <div className={styles.contentArea}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Cargando inventario...</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        {/* Search Bar */}
                        <div style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, SKU o categoría..."
                                className={styles.secondaryButton}
                                style={{ width: '100%', paddingLeft: '42px', textAlign: 'left', background: 'white' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Summary Cards */}
                        <div className={styles.statsGrid}>
                            <div className={styles.kpiCard}>
                                <span className={styles.kpiLabel}>Total Productos</span>
                                <div className={styles.kpiValue} style={{ color: '#3b82f6' }}>{products.length}</div>
                            </div>
                            <div className={styles.kpiCard}>
                                <span className={styles.kpiLabel}>Valor Inventario</span>
                                <div className={styles.kpiValue} style={{ color: '#10b981' }}>
                                    {formatCurrency(products.reduce((acc, p) => acc + (p.cost * p.stock), 0))}
                                </div>
                            </div>
                            <div className={styles.kpiCard}>
                                <span className={styles.kpiLabel}>Stock Bajo</span>
                                <div className={styles.kpiValue} style={{ color: '#f59e0b' }}>
                                    {products.filter(p => p.stock <= p.min_stock).length}
                                </div>
                            </div>
                        </div>

                        {/* Low Stock Alert */}
                        {products.some(p => p.stock <= p.min_stock) && (
                            <div className={styles.alert}>
                                <AlertTriangle size={20} color="#f59e0b" />
                                <span className={styles.alertText}>
                                    Atención: Hay {products.filter(p => p.stock <= p.min_stock).length} productos con stock bajo.
                                </span>
                            </div>
                        )}

                        {/* DESKTOP TABLE VIEW */}
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th>SKU/Código</th>
                                        <th>Categoría</th>
                                        <th style={{ textAlign: 'center' }}>Stock</th>
                                        <th style={{ textAlign: 'right' }}>Costo</th>
                                        <th style={{ textAlign: 'right' }}>Valor Total</th>
                                        <th style={{ textAlign: 'center' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.length > 0 ? (
                                        filteredProducts.map(product => (
                                            <tr key={product.id}>
                                                <td style={{ fontWeight: 600, color: '#0f172a' }}>{product.name}</td>
                                                <td style={{ color: '#64748b', fontSize: '0.85rem', fontFamily: 'monospace' }}>{product.sku || '-'}</td>
                                                <td>
                                                    <span className={styles.categoryBadge}>{product.category || 'General'}</span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span
                                                        className={styles.stockBadge}
                                                        style={{
                                                            background: product.stock <= product.min_stock ? '#fef2f2' : '#f0fdf4',
                                                            color: product.stock <= product.min_stock ? '#ef4444' : '#15803d'
                                                        }}
                                                    >
                                                        {product.stock} {product.unit}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>{formatCurrency(product.cost)}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(product.cost * product.stock)}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <button onClick={() => handleEditProduct(product)} className={styles.iconBtn} title="Editar">
                                                        <Edit2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No hay resultados.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* MOBILE CARD VIEW */}
                        <div className={styles.cardList}>
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map(product => (
                                    <div key={product.id} className={styles.productCard}>
                                        <div className={styles.cardHeader}>
                                            <div className={styles.productMainInfo}>
                                                <span className={styles.productName}>{product.name}</span>
                                                <span className={styles.productSku}>{product.sku || 'Sin SKU'}</span>
                                            </div>
                                            <span className={styles.categoryBadge}>{product.category || 'General'}</span>
                                        </div>

                                        <div className={styles.cardDetails}>
                                            <div className={styles.detailItem}>
                                                <span className={styles.detailLabel}>Stock Actual</span>
                                                <span className={styles.stockBadge} style={{
                                                    background: product.stock <= product.min_stock ? '#fef2f2' : '#f0fdf4',
                                                    color: product.stock <= product.min_stock ? '#ef4444' : '#15803d'
                                                }}>
                                                    {product.stock} {product.unit}
                                                </span>
                                            </div>
                                            <div className={styles.detailItem}>
                                                <span className={styles.detailLabel}>Valor Stock</span>
                                                <span className={styles.detailValue}>{formatCurrency(product.cost * product.stock)}</span>
                                            </div>
                                            <div className={styles.detailItem}>
                                                <span className={styles.detailLabel}>Costo Unit.</span>
                                                <span className={styles.detailValue}>{formatCurrency(product.cost)}</span>
                                            </div>
                                        </div>

                                        <div className={styles.cardActions}>
                                            <button
                                                className={styles.secondaryButton}
                                                style={{ flex: 1 }}
                                                onClick={() => handleEditProduct(product)}
                                            >
                                                <Edit2 size={16} /> Editar Producto
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No hay resultados.</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Floating button for small screens */}
            <button className={`${styles.addButton} ${styles.mobileFab}`} onClick={handleOpenCreateProduct} title="Nuevo Producto">
                <Plus size={24} />
            </button>

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
        </div >
    );
};

export default InventoryPage;
