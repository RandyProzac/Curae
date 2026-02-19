export const FDI_DR_UPPER = [18, 17, 16, 15, 14, 13, 12, 11];
export const FDI_DL_UPPER = [21, 22, 23, 24, 25, 26, 27, 28];
export const FDI_DR_LOWER = [48, 47, 46, 45, 44, 43, 42, 41];
export const FDI_DL_LOWER = [31, 32, 33, 34, 35, 36, 37, 38];

export const FDI_ALL_TEETH = [...FDI_DR_UPPER, ...FDI_DL_UPPER, ...FDI_DR_LOWER, ...FDI_DL_LOWER];

export const TOOTH_REGIONS = {
    TOP: 'top',
    BOTTOM: 'bottom',
    LEFT: 'left',
    RIGHT: 'right',
    CENTER: 'center'
};

export const PATHOLOGY_TYPES = {
    CARIES: { id: 'caries', label: 'Caries', color: 'var(--pathology-red)' },
    OBTURACION: { id: 'obturacion', label: 'Obturación', color: 'var(--treatment-blue)' },
    FRACTURA: { id: 'fractura', label: 'Fractura', color: 'var(--pathology-red)' },
    CORONA: { id: 'corona', label: 'Corona', color: 'var(--treatment-blue)' },
};
