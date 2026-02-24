import React from 'react';
import { createPortal } from 'react-dom';
import styles from './PrintableBudget.module.css';
import logo from '../../assets/logo_curae.svg';

/**
 * PrintableBudget
 * A hidden component that only appears when printing.
 * Takes patient data, budget data, active doctor, and optionally an array of itemIds to print.
 */
const PrintableBudget = ({ patientName, patientPhone, budget, planTitle, printItemIds, activeDoctor }) => {
    if (!budget) return null;

    // Higher-level items array that handles both naming conventions
    const items = budget.budget_items || budget.items || [];

    // Filter items if specific printItemIds are provided
    const itemsToPrint = (printItemIds && Array.isArray(printItemIds) && printItemIds.length > 0)
        ? items.filter(item => printItemIds.includes(item.id))
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
            {/* Header matches reference PDF */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <img src={logo} alt="Estudio Dental Curae" className={styles.logoImg} />
                </div>
                <div className={styles.headerRight}>
                    <h1 className={styles.clinicName}>Estudio Dental Curae</h1>
                    <p className={styles.doctorInfo}>
                        <strong>Dra.</strong> {activeDoctor?.name || 'Luciana Jimenez Aranzaens'}
                        {activeDoctor?.specialty && <>, <strong>Esp.</strong> {activeDoctor.specialty}</>}
                        {activeDoctor?.cop && <>, <strong>COP Profesional:</strong> {activeDoctor.cop}</>}
                    </p>
                    <p className={styles.dateInfo}>
                        <strong>Fecha impresión:</strong> {currentDate}
                    </p>
                    <p className={styles.idInfo}>
                        <strong>ID:</strong> {budget.id?.substring(0, 8).toUpperCase()}
                    </p>
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

            <div className={styles.summarySection}>
                <div className={styles.totalsBox}>
                    <h3>Resumen del Presupuesto:</h3>
                    <div className={styles.summaryRow}>
                        <span>Prestaciones Clínicas</span>
                        <span>S/ {subtotal.toFixed(2)}</span>
                    </div>
                    <div className={`${styles.summaryRow} ${styles.boldRow}`}>
                        <span>Subtotal</span>
                        <span>S/ {subtotal.toFixed(2)}</span>
                    </div>
                    {totalDiscount > 0 && (
                        <div className={styles.summaryRow}>
                            <span>Descuento total</span>
                            <span>(-) S/ {totalDiscount.toFixed(2)}</span>
                        </div>
                    )}
                    <br />

                    <div className={`${styles.summaryRow} ${styles.grandTotalRow} ${styles.grayBg}`}>
                        <span>Total del presupuesto</span>
                        <span>S/ {total.toFixed(2)}</span>
                    </div>
                </div>

                <div className={styles.totalsBox}>
                    <h3>Estado de cuenta:</h3>
                    <div className={styles.summaryRow}>
                        <span>Total del presupuesto</span>
                        <span>S/ {total.toFixed(2)}</span>
                    </div>
                    <div className={styles.summaryRow}>
                        <span>Abonos del paciente</span>
                        <span>(-) S/ {paid.toFixed(2)}</span>
                    </div>
                    <br />

                    <div className={`${styles.summaryRow} ${styles.grandTotalRow} ${styles.grayBg}`}>
                        <span>Total por pagar</span>
                        <span>S/ {balance.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className={styles.footerNotes}>
                <p>Este documento es un presupuesto orientativo y está sujeto a reevaluación clínica. Tiene una validez de 30 días calendario.</p>

                <div className={styles.signatures}>
                    <div className={styles.signatureBlock}>
                        <div className={styles.signatureBox}>
                            {activeDoctor?.signature_url && (
                                <img
                                    src={activeDoctor.signature_url}
                                    alt={`Firma ${activeDoctor.name}`}
                                    className={styles.signatureImage}
                                />
                            )}
                        </div>
                        <div className={styles.line}></div>
                        <p className={styles.signatureName}>{activeDoctor?.name || 'Dr. Principal'}</p>
                        <p className={styles.signatureTitle}>Firma del Odontólogo</p>
                        {activeDoctor?.cop && (
                            <p className={styles.signatureCop}>C.O.P: {activeDoctor.cop}</p>
                        )}
                    </div>

                    <div className={styles.signatureBlock}>
                        <div className={styles.signatureBox}></div>
                        <div className={styles.line}></div>
                        <p className={styles.signatureName}>{patientName}</p>
                        <p className={styles.signatureTitle}>Firma del Paciente</p>
                        {/* Space for DNI can be added here if needed */}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PrintableBudget;
