import React from 'react';
import styles from './Tooth.module.css';

const Tooth = ({ number, states, onRegionClick }) => {
    // states is an object where keys are regions (top, bottom, left, right, center)
    // and values are the status (pathology, treatment, etc.)

    const renderRegion = (region, path) => {
        const status = states?.[region];
        const fillColor = status === 'pathology' ? 'var(--pathology-red)' :
            status === 'treatment' ? 'var(--treatment-blue)' :
                '#fff';

        return (
            <path
                d={path}
                fill={fillColor}
                stroke="#ccc"
                strokeWidth="1"
                className={styles.region}
                onClick={() => onRegionClick(number, region)}
            />
        );
    };

    return (
        <div className={styles.toothContainer}>
            <span className={styles.toothNumber}>{number}</span>
            <svg width="40" height="40" viewBox="0 0 40 40" className={styles.toothSvg}>
                {/* Top Region */}
                {renderRegion('top', 'M0,0 L40,0 L30,10 L10,10 Z')}
                {/* Bottom Region */}
                {renderRegion('bottom', 'M0,40 L40,40 L30,30 L10,30 Z')}
                {/* Left Region */}
                {renderRegion('left', 'M0,0 L0,40 L10,30 L10,10 Z')}
                {/* Right Region */}
                {renderRegion('right', 'M40,0 L40,40 L30,30 L30,10 Z')}
                {/* Center Region */}
                {renderRegion('center', 'M10,10 L30,10 L30,30 L10,30 Z')}
            </svg>
        </div>
    );
};

export default Tooth;
