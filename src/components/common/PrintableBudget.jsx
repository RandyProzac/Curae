import React from 'react';
import { createPortal } from 'react-dom';
import styles from './PrintableBudget.module.css';

/**
 * PrintableBudget
 * A hidden component that only appears when printing.
 * Takes patient data, budget data, and optionally a single itemId to print.
 */
const PrintableBudget = ({ patientName, patientPhone, budget, planTitle, printItemId }) => {
    if (!budget) return null;

    // Higher-level items array that handles both naming conventions
    const items = budget.budget_items || budget.items || [];

    // Filter items if a specific itemId is provided
    const itemsToPrint = printItemId
        ? items.filter(item => item.id === printItemId)
        : items;

    if (itemsToPrint.length === 0) return null;

    // Calculate totals for the items being printed
    let subtotal = 0;
    let totalDiscount = 0;
    let paid = 0;

    itemsToPrint.forEach(item => {
        const rawPrice = parseFloat(item.unit_price) * (item.quantity || 1);
        subtotal += rawPrice;

        const discountVal = parseFloat(item.discount || 0);
        const itemDiscountAmount = (item.discount_type === 'percent')
            ? (rawPrice * discountVal / 100)
            : discountVal;

        totalDiscount += itemDiscountAmount;
        paid += parseFloat(item.paid_amount || 0);
    });

    const total = Math.max(0, subtotal - totalDiscount);
    const balance = Math.max(0, total - paid);

    const currentDate = new Date().toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return createPortal(
        <div id="printable-budget-container" className={styles.printableWrapper}>
            {/* Header with Logo and Info */}
            <div className={styles.header}>
                <div className={styles.logoSection}>
                    <h1 className={styles.logoText}>Curae</h1>
                    <p className={styles.clinicInfo}>Centro Odontológico</p>
                </div>
                <div className={styles.documentInfo}>
                    <h2 className={styles.documentTitle}>Presupuesto</h2>
                    <p className={styles.date}>Fecha: {currentDate}</p>
                </div>
            </div>

            <div className={styles.patientInfo}>
                <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Paciente:</span>
                    <span className={styles.infoValue}>{patientName}</span>
                </div>
                {patientPhone && (
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Teléfono:</span>
                        <span className={styles.infoValue}>{patientPhone}</span>
                    </div>
                )}
                <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Documento Ref:</span>
                    <span className={styles.infoValue}>
                        {planTitle || budget.title || `Presupuesto #${budget.id?.substring(0, 8)}`}
                    </span>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Concepto</th>
                            <th>Nota/Diente</th>
                            <th className={styles.textCenter}>Cant.</th>
                            <th className={styles.textRight}>Precio Unit.</th>
                            <th className={styles.textRight}>Dscto.</th>
                            <th className={styles.textRight}>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {itemsToPrint.map(item => {
                            const rawPrice = parseFloat(item.unit_price) * (item.quantity || 1);
                            const discountVal = parseFloat(item.discount || 0);
                            const itemDiscount = (item.discount_type === 'percent')
                                ? (rawPrice * discountVal / 100) : discountVal;
                            const itemSubtotal = rawPrice - itemDiscount;

                            return (
                                <tr key={item.id}>
                                    <td className={styles.conceptCol}>{item.service_name}</td>
                                    <td>{item.tooth_number || '-'}</td>
                                    <td className={styles.textCenter}>{item.quantity}</td>
                                    <td className={styles.textRight}>S/ {parseFloat(item.unit_price).toFixed(2)}</td>
                                    <td className={styles.textRight}>
                                        {itemDiscount > 0 ? `- S/ ${itemDiscount.toFixed(2)}` : '-'}
                                    </td>
                                    <td className={styles.textRight}>S/ {itemSubtotal.toFixed(2)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className={styles.totalsSection}>
                <div className={styles.totalsBox}>
                    <div className={styles.totalRow}>
                        <span>Subtotal:</span>
                        <span>S/ {subtotal.toFixed(2)}</span>
                    </div>
                    {totalDiscount > 0 && (
                        <div className={styles.totalRow}>
                            <span>Descuento:</span>
                            <span>- S/ {totalDiscount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                        <span>Total:</span>
                        <span>S/ {total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className={styles.footerNotes}>
                <p>Este documento es un presupuesto orientativo y está sujeto a reevaluación clínica. Tiene una validez de 30 días.</p>
                <div className={styles.signatures}>
                    <div className={styles.signatureLine}>
                        <div className={styles.line}></div>
                        <p>Firma del Odontólogo</p>
                    </div>
                    <div className={styles.signatureLine}>
                        <div className={styles.line}></div>
                        <p>Firma del Paciente</p>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PrintableBudget;
