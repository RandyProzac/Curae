import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Stage, Grid, Html } from '@react-three/drei';
import { STLLoader } from 'three-stdlib';

const Model = ({ url }) => {
    const geometry = useLoader(STLLoader, url);
    const processedRef = useRef(false);

    useEffect(() => {
        if (geometry && !processedRef.current) {
            geometry.center();
            geometry.computeVertexNormals();
            processedRef.current = true;
        }
        return () => { processedRef.current = false; };
    }, [geometry]);

    return (
        <mesh geometry={geometry}>
            <meshStandardMaterial
                color="#f4f4f5"
                roughness={0.6}
                metalness={0.1}
            />
        </mesh>
    );
};

// Error Boundary Local
class ErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { hasError: false }; }
    static getDerivedStateFromError(error) { return { hasError: true }; }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ color: '#ef4444', textAlign: 'center', padding: '20px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div>⚠️ No se pudo renderizar el modelo 3D. <br /><small>Intenta con un archivo más ligero.</small></div>
                </div>
            );
        }
        return this.props.children;
    }
}

const Loader = () => (
    <Html center>
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', background: 'rgba(255,255,255,0.8)',
            padding: '16px', borderRadius: '12px', backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                border: '3px solid #cbd5e1', borderTopColor: '#0f766e',
                animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ marginTop: '12px', fontSize: '14px', color: '#0f172a', fontWeight: 600 }}>
                Cargando...
            </p>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </Html>
);

export default function STLViewer({ url }) {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (!url) {
            setReady(false);
            return;
        }
        // Defer Canvas mount to next frame so the container has its final dimensions
        const raf = requestAnimationFrame(() => setReady(true));
        return () => {
            cancelAnimationFrame(raf);
            setReady(false);
        };
    }, [url]);

    if (!url) return null;

    return (
        <div style={{ width: '100%', height: '100%', background: '#f8fafc', borderRadius: '8px', position: 'relative', overflow: 'hidden' }}>
            <ErrorBoundary>
                {ready ? (
                    <Suspense fallback={
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                border: '3px solid #cbd5e1', borderTopColor: '#0f766e',
                                animation: 'spin 1s linear infinite'
                            }}></div>
                        </div>
                    }>
                        <Canvas key={url} shadows camera={{ position: [0, 0, 150], fov: 50 }} dpr={[1, 2]}>
                            <color attach="background" args={['#f1f5f9']} />

                            <Stage environment="city" intensity={0.5} contactShadow={{ opacity: 0.4, blur: 2 }}>
                                <Model url={url} />
                            </Stage>

                            <OrbitControls makeDefault autoRotate autoRotateSpeed={1} />
                            <Grid args={[100, 100]} cellColor="#e2e8f0" sectionColor="#cbd5e1" fadeStrength={0.5} />
                        </Canvas>
                    </Suspense>
                ) : (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            border: '3px solid #cbd5e1', borderTopColor: '#0f766e',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                    </div>
                )}
            </ErrorBoundary>

            <div style={{
                position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(4px)',
                padding: '6px 16px', borderRadius: '100px',
                fontSize: '12px', color: '#64748b',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                whiteSpace: 'nowrap', pointerEvents: 'none', userSelect: 'none'
            }}>
                🖱️ Rotar: Click izquierdo | ✋ Mover: Click derecho | 🔍 Zoom: Rueda
            </div>
        </div>
    );
}
