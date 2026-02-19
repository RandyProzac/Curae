import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught Error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f8fafc',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                    <div style={{
                        background: 'white',
                        padding: '40px',
                        borderRadius: '16px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        textAlign: 'center',
                        maxWidth: '500px',
                        width: '90%'
                    }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            background: '#fee2e2',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px auto',
                            color: '#ef4444'
                        }}>
                            <AlertTriangle size={32} />
                        </div>

                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            color: '#1e293b',
                            marginBottom: '12px'
                        }}>
                            Algo salió mal
                        </h2>

                        <p style={{
                            color: '#64748b',
                            lineHeight: '1.6',
                            marginBottom: '32px'
                        }}>
                            Ha ocurrido un error inesperado en la aplicación.
                            Hemos registrado el problema para corregirlo.
                        </p>

                        <button
                            onClick={this.handleReload}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                width: '100%',
                                transition: 'background 0.2s'
                            }}
                        >
                            <RefreshCcw size={18} />
                            Recargar Aplicación
                        </button>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div style={{
                                marginTop: '32px',
                                textAlign: 'left',
                                background: '#f1f5f9',
                                padding: '16px',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                color: '#ef4444',
                                overflow: 'auto',
                                maxHeight: '200px'
                            }}>
                                <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Error Técnico:</p>
                                <code style={{ fontFamily: 'monospace' }}>
                                    {this.state.error.toString()}
                                </code>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
