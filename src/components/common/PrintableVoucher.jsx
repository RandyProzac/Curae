import React from 'react';
import { createRoot } from 'react-dom/client';
import logo from '../../assets/logo_curae.svg';

/**
 * Isolated Voucher Content
 * Uses inline styles so it works perfectly inside an iframe without needing external CSS.
 */
const VoucherContent = ({ voucher }) => {
    const ticketNum = String(voucher.ticket_number ?? '').padStart(8, '0');

    const createdAt = voucher.created_at ? new Date(voucher.created_at) : new Date();
    const fecha = createdAt.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const hora  = createdAt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true });

    const patient    = voucher.patient    || {};
    const doctor     = voucher.doctor     || {};
    const items      = voucher.voucher_items || [];
    const payMethods = voucher.voucher_payment_methods || [];

    const totalPaid = payMethods.reduce((sum, pm) => sum + parseFloat(pm.amount || 0), 0);

    const s = {
        wrapper: {
            width: '80mm',
            margin: '0 auto',
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '12px',
            color: '#000',
            background: '#fff',
            lineHeight: '1.4'
        },
        header: { textAlign: 'center', marginBottom: '10px' },
        logo: { width: '60px', height: 'auto', marginBottom: '5px' },
        title: { fontSize: '14px', fontWeight: 'bold', margin: '0 0 4px 0' },
        subtitle: { fontSize: '11px', margin: '0' },
        ticketNum: { fontSize: '12px', fontWeight: 'bold', margin: '6px 0' },
        divider: { borderTop: '1px dashed #000', margin: '10px 0' },
        field: { margin: '3px 0', fontSize: '11px' },
        table: { width: '100%', borderCollapse: 'collapse', margin: '10px 0' },
        th: { borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '4px 2px', textAlign: 'left', fontSize: '11px' },
        thRight: { borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '4px 2px', textAlign: 'right', fontSize: '11px' },
        tdCant: { width: '30px', verticalAlign: 'top', padding: '4px 2px', fontSize: '11px' },
        tdItem: { verticalAlign: 'top', padding: '4px 2px', fontSize: '11px' },
        tdPrice: { textAlign: 'right', verticalAlign: 'top', padding: '4px 2px', fontSize: '11px' },
        tfootTh: { borderTop: '1px dashed #000', padding: '6px 2px', fontSize: '12px', textAlign: 'left' },
        tfootTd: { borderTop: '1px dashed #000', padding: '6px 2px', fontSize: '12px', textAlign: 'right', fontWeight: 'bold' },
        payMethod: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', margin: '2px 0' },
        thanks: { textAlign: 'center', fontSize: '12px', fontWeight: 'bold', marginTop: '15px' }
    };

    return (
        <div style={s.wrapper}>
            <div style={s.header}>
                <img src={window.location.origin + logo} alt="Logo" style={s.logo} />
                <h2 style={s.title}>ESTUDIO DENTAL CURAE</h2>
                <p style={s.subtitle}>RUC: 20606616130</p>
                <p style={s.ticketNum}>TICKET BOLETA: B{ticketNum}</p>
            </div>

            <div style={s.divider} />

            <div>
                <p style={s.field}><strong>Fecha:</strong> {fecha} {hora}</p>
                <p style={s.field}><strong>Cliente:</strong> {patient.first_name} {patient.last_name}</p>
                {patient.dni && <p style={s.field}><strong>DNI/CE:</strong> {patient.dni}</p>}
                {doctor.name && <p style={s.field}><strong>Atendido por:</strong> {doctor.name}</p>}
            </div>

            <table style={s.table}>
                <thead>
                    <tr>
                        <th style={s.th}>CANT</th>
                        <th style={s.th}>DESCRIPCIÓN</th>
                        <th style={s.thRight}>TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((it, idx) => (
                        <tr key={idx}>
                            <td style={s.tdCant}>{it.quantity}</td>
                            <td style={s.tdItem}>{it.service_name}</td>
                            <td style={s.tdPrice}>S/ {parseFloat(it.amount_paid).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr>
                        <th colSpan={2} style={s.tfootTh}>TOTAL PAGADO</th>
                        <td style={s.tfootTd}>S/ {totalPaid.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>

            {payMethods.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '4px', margin: 0 }}>MÉTODOS DE PAGO:</p>
                    {payMethods.map((pm, idx) => (
                        <div key={idx} style={s.payMethod}>
                            <span>{pm.method.toUpperCase()}</span>
                            <span>S/ {parseFloat(pm.amount).toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            )}

            <div style={s.thanks}>
                ¡GRACIAS POR SU PREFERENCIA!
            </div>
        </div>
    );
};

/**
 * Triggers the print dialog in an isolated iframe.
 * @param {Object} voucher The full voucher data object.
 */
export const printVoucherToIframe = (voucher) => {
    if (!voucher) return;

    // Create an invisible iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '-9999px';
    iframe.style.width = '80mm';
    iframe.style.height = '100vh';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
        <!DOCTYPE html>
        <html>
            <head>
                <style>
                    @page { margin: 0; }
                    body { margin: 0; padding: 10px; background: white; }
                </style>
            </head>
            <body>
                <div id="voucher-root"></div>
            </body>
        </html>
    `);
    doc.close();

    const root = createRoot(doc.getElementById('voucher-root'));
    root.render(<VoucherContent voucher={voucher} />);

    // Wait for React and logo image to load
    setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        
        setTimeout(() => {
            root.unmount();
            document.body.removeChild(iframe);
        }, 2000);
    }, 800);
};

// We no longer export a default component, just the utility function
export default VoucherContent;
