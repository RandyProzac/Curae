import React, { useState, useEffect, useCallback } from 'react';
import {
    Search,
    Plus,
    Download,
    Trash2,
    Edit2,
    TrendingDown,
    DollarSign,
    Tag,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown
} from 'lucide-react';
import { expensesApi } from '../lib/supabase';
import ExpenseModal from '../components/finance/ExpenseModal';
import styles from './ExpensesPage.module.css';

const ExpensesPage = () => {
    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [data, cats] = await Promise.all([
                expensesApi.getByPeriod(dateRange.start, dateRange.end),
                expensesApi.getCategories()
            ]);
            setExpenses(data);
            setCategories(cats);
        } catch (error) {
            console.error('Error loading expenses:', error);
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSave = async (formData) => {
        if (selectedExpense) {
            await expensesApi.update(selectedExpense.id, formData);
        } else {
            await expensesApi.create(formData);
        }
        loadData();
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este gasto?')) {
            await expensesApi.delete(id);
            loadData();
        }
    };

    const handleEdit = (expense) => {
        setSelectedExpense(expense);
        setIsModalOpen(true);
    };

    const handleNew = () => {
        setSelectedExpense(null);
        setIsModalOpen(true);
    };

    const formatCurrency = (val) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(val || 0);

    const filteredExpenses = expenses.filter(e => {
        const matchesSearch = e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.supplier?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !categoryFilter || e.category === categoryFilter;
        const matchesStatus = !statusFilter || e.status === statusFilter;
        return matchesSearch && matchesCategory && matchesStatus;
    });

    const totals = filteredExpenses.reduce((acc, curr) => {
        acc.total += parseFloat(curr.amount) || 0;
        if (curr.status === 'pagado') acc.paid += parseFloat(curr.amount) || 0;
        else acc.pending += parseFloat(curr.amount) || 0;
        return acc;
    }, { total: 0, paid: 0, pending: 0 });

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.title}>
                    <h2>Gestión de Gastos 💸</h2>
                    <p>Control detallado de egresos y facturas.</p>
                </div>
                <button className={styles.addBtn} onClick={handleNew}>
                    <Plus size={20} /> Nuevo Gasto
                </button>
            </header>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.iconRed}`}>
                        <TrendingDown size={24} />
                    </div>
                    <div className={styles.statInfo}>
                        <h4>Total Gastos</h4>
                        <p className={styles.statValue}>{formatCurrency(totals.total)}</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.iconBlue}`}>
                        <DollarSign size={24} />
                    </div>
                    <div className={styles.statInfo}>
                        <h4>Pagado</h4>
                        <p className={styles.statValue}>{formatCurrency(totals.paid)}</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.iconAmber}`}>
                        <AlertTriangle size={24} />
                    </div>
                    <div className={styles.statInfo}>
                        <h4>Pendiente</h4>
                        <p className={styles.statValue}>{formatCurrency(totals.pending)}</p>
                    </div>
                </div>
            </div>

            <div className={styles.controls}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} size={18} />
                    <input
                        className={styles.searchInput}
                        placeholder="Buscar por descripción o proveedor..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className={styles.filterGroup}>
                    <input
                        type="date"
                        className={styles.select}
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    />
                    <input
                        type="date"
                        className={styles.select}
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    />
                    <select
                        className={styles.select}
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="">Todas las Categorías</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>
                    <select
                        className={styles.select}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">Todos los Estados</option>
                        <option value="pagado">Pagado</option>
                        <option value="pendiente">Pendiente</option>
                    </select>
                </div>
            </div>

            <div className={styles.tableWrapper}>
                {loading ? (
                    <div className={styles.loading}>Analizando finanzas...</div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Descripción / Proveedor</th>
                                <th>Categoría</th>
                                <th>Monto</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.map(expense => (
                                <tr key={expense.id} className={styles.expenseRow}>
                                    <td>{new Date(expense.date).toLocaleDateString('es-ES')}</td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{expense.description || 'Sin descripción'}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{expense.supplier}</div>
                                    </td>
                                    <td>
                                        <span className={styles.categoryBadge}>{expense.category}</span>
                                    </td>
                                    <td className={styles.amount}>{formatCurrency(expense.amount)}</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${expense.status === 'pagado' ? styles.statusPagado : styles.statusPendiente}`}>
                                            {expense.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => handleEdit(expense)}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(expense.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {!loading && filteredExpenses.length === 0 && (
                    <div className={styles.noResults}>No se encontraron gastos para este periodo.</div>
                )}
            </div>

            <ExpenseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                expense={selectedExpense}
            />
        </div>
    );
};

export default ExpensesPage;
