import React, { useMemo } from 'react';

const TimeCombobox = ({ value, onChange, placeholder }) => {
    // Generate time slots 7:00 to 20:00
    const timeSlots = useMemo(() => {
        const slots = [];
        for (let i = 7; i <= 20; i++) {
            const h = i.toString().padStart(2, '0');
            slots.push(`${h}:00`);
            if (i < 20) slots.push(`${h}:30`);
        }
        return slots;
    }, []);

    return (
        <div style={{ position: 'relative' }}>
            <input
                type="time"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '14px',
                    color: '#1e293b',
                    background: 'white',
                    boxSizing: 'border-box',
                }}
            />
        </div>
    );
};

export default TimeCombobox;
