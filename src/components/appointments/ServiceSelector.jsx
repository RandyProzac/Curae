import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Check } from 'lucide-react';
import { servicesApi } from '../../lib/supabase';

const ServiceSelector = ({ value, onChange, placeholder = "Buscar servicio..." }) => {
    const [services, setServices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    // Initial load
    useEffect(() => {
        loadServices();
    }, []);

    // Set search term if value provided (initial edit state)
    useEffect(() => {
        if (value && services.length > 0) {
            const selected = services.find(s => s.id === value || s.name === value);
            if (selected) {
                setSearchTerm(selected.name);
            } else if (typeof value === 'string') {
                setSearchTerm(value);
            }
        }
    }, [value, services]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadServices = async () => {
        try {
            setLoading(true);
            const data = await servicesApi.getAll();
            setServices(data);
        } catch (error) {
            console.error('Error loading services:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter and Group
    const getFilteredGroupedServices = () => {
        if (!searchTerm) return {};

        const filtered = services.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.category?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return filtered.reduce((acc, service) => {
            const cat = service.category || 'Otros';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(service);
            return acc;
        }, {});
    };

    const handleSelect = (service) => {
        setSearchTerm(service.name);
        onChange(service); // Pass full service object back
        setIsOpen(false);
    };

    const handleClear = () => {
        setSearchTerm('');
        onChange(null);
        inputRef.current?.focus();
    };

    const groupedServices = getFilteredGroupedServices();
    const hasResults = Object.keys(groupedServices).length > 0;

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />

                <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    style={{
                        width: '100%',
                        padding: '10px 10px 10px 38px',
                        paddingRight: searchTerm ? '32px' : '10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        borderColor: isOpen ? '#2563eb' : '#cbd5e1',
                        boxShadow: isOpen ? '0 0 0 3px rgba(37, 99, 235, 0.1)' : 'none'
                    }}
                />

                {searchTerm && (
                    <button
                        type="button"
                        onClick={handleClear}
                        style={{
                            position: 'absolute',
                            right: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: '#9ca3af',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex'
                        }}
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {isOpen && searchTerm && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    background: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    border: '1px solid #e2e8f0',
                    zIndex: 50,
                    maxHeight: '300px',
                    overflowY: 'auto'
                }}>
                    {hasResults ? (
                        Object.entries(groupedServices).map(([category, items]) => (
                            <div key={category}>
                                <div style={{
                                    padding: '8px 12px',
                                    background: '#f8fafc',
                                    color: '#64748b',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    borderBottom: '1px solid #f1f5f9',
                                    borderTop: '1px solid #f1f5f9'
                                }}>
                                    {category}
                                </div>
                                {items.map(service => (
                                    <div
                                        key={service.id}
                                        onClick={() => handleSelect(service)}
                                        style={{
                                            padding: '10px 12px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            transition: 'background 0.1s',
                                            borderBottom: '1px solid #f8fafc'
                                        }}
                                        className="hover:bg-blue-50"
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <span style={{ color: '#334155', fontSize: '14px' }}>{service.name}</span>
                                        <span style={{ color: '#0f172a', fontWeight: '600', fontSize: '13px' }}>
                                            S/ {service.price.toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                            No se encontraron servicios similar a "{searchTerm}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ServiceSelector;
