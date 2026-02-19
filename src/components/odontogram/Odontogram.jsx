import React, { useState } from 'react';
import Tooth from './Tooth';
import { FDI_DR_UPPER, FDI_DL_UPPER, FDI_DR_LOWER, FDI_DL_LOWER } from '../../utils/fdiSystem';
import styles from './Odontogram.module.css';

const Odontogram = () => {
    const [teethData, setTeethData] = useState({});

    const handleRegionClick = (toothNum, region) => {
        setTeethData(prev => {
            const tooth = prev[toothNum] || {};
            const currentStatus = tooth[region];

            // Cycle through states: none -> pathology -> treatment -> none
            let nextStatus = null;
            if (!currentStatus) nextStatus = 'pathology';
            else if (currentStatus === 'pathology') nextStatus = 'treatment';

            return {
                ...prev,
                [toothNum]: {
                    ...tooth,
                    [region]: nextStatus
                }
            };
        });
    };

    const renderCuadrante = (teeth, title) => (
        <div className={styles.cuadrante}>
            <header className={styles.cuadranteHeader}>{title}</header>
            <div className={styles.teethRow}>
                {teeth.map(num => (
                    <Tooth
                        key={num}
                        number={num}
                        states={teethData[num]}
                        onRegionClick={handleRegionClick}
                    />
                ))}
            </div>
        </div>
    );

    return (
        <div className={styles.odontogramContainer}>
            <div className={styles.upperJaw}>
                {renderCuadrante(FDI_DR_UPPER, 'C1 (Superior Derecho)')}
                {renderCuadrante(FDI_DL_UPPER, 'C2 (Superior Izquierdo)')}
            </div>
            <div className={styles.divider}></div>
            <div className={styles.lowerJaw}>
                {renderCuadrante(FDI_DR_LOWER, 'C4 (Inferior Derecho)')}
                {renderCuadrante(FDI_DL_LOWER, 'C3 (Inferior Izquierdo)')}
            </div>

            <div className={styles.legend}>
                <h4>Leyenda</h4>
                <div className={styles.legendItems}>
                    <div className={styles.legendItem}>
                        <div className={styles.colorBox} style={{ backgroundColor: 'var(--pathology-red)' }}></div>
                        <span>Patología (Rojo)</span>
                    </div>
                    <div className={styles.legendItem}>
                        <div className={styles.colorBox} style={{ backgroundColor: 'var(--treatment-blue)' }}></div>
                        <span>Tratamiento (Azul)</span>
                    </div>
                    <div className={styles.legendItem}>
                        <div className={styles.helpText}>* Haz click en las regiones de cada diente para alternar estados.</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Odontogram;
