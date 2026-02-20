import React, { useState, useEffect } from 'react';
import { Stethoscope, Coffee } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import styles from './DoctorStatusBoard.module.css';

const DoctorStatusBoard = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchStatus = async () => {
        try {
            // 1. Get all doctors
            const { data: docsRes } = await supabase.from('doctors').select('*');
            if (!docsRes) return;

            // 2. Get today's appointments
            const todayStr = new Date().toISOString().split('T')[0];
            const { data: aptsRes } = await supabase
                .from('appointments')
                .select('doctor_id, start_time, end_time, status, service:services(name), motivo')
                .eq('date', todayStr)
                .neq('status', 'cancelled');

            const now = new Date();
            const currentMins = now.getHours() * 60 + now.getMinutes();

            // 3. Map status
            const mappedDoctors = docsRes.map(doc => {
                const docApts = (aptsRes || []).filter(a => a.doctor_id === doc.id);

                // Find if any appointment is active NOW
                const activeApt = docApts.find(a => {
                    if (!a.start_time) return false;
                    const startMins = parseInt(a.start_time.split(':')[0]) * 60 + parseInt(a.start_time.split(':')[1]);
                    // calculate duration or use end_time if available, assuming 30mins if no end_time
                    let endMins = startMins + 30;
                    if (a.end_time) {
                        endMins = parseInt(a.end_time.split(':')[0]) * 60 + parseInt(a.end_time.split(':')[1]);
                    }

                    return currentMins >= startMins && currentMins <= endMins;
                });

                const color = doc.color || '#3b82f6';

                return {
                    ...doc,
                    color,
                    isBusy: !!activeApt,
                    currentTask: activeApt ? (activeApt.service?.name || activeApt.motivo || 'Consulta en curso') : 'Libre'
                };
            });

            // Sort: Busy first, then alphabetically
            mappedDoctors.sort((a, b) => {
                if (a.isBusy && !b.isBusy) return -1;
                if (!a.isBusy && b.isBusy) return 1;
                return a.name.localeCompare(b.name);
            });

            setDoctors(mappedDoctors);
        } catch (error) {
            console.error('Error fetching doctor status:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        // Refresh every minute to keep realtime status
        const interval = setInterval(fetchStatus, 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return null;

    return (
        <div className={styles.statusContainer}>
            {doctors.map(doc => {
                // Ensure text is readable against their color theme
                return (
                    <div key={doc.id} className={styles.doctorCard}>
                        {doc.isBusy ? (
                            <>
                                <div className={styles.busyAvatar} style={{ color: doc.color, backgroundColor: `${doc.color}20` }}>
                                    <div className={styles.busyRing} style={{ borderColor: doc.color, opacity: 0.6 }}></div>
                                    <Stethoscope size={24} />
                                    <div className={styles.busyDot} style={{ backgroundColor: doc.color }}></div>
                                </div>
                                <div className={styles.info}>
                                    <span className={styles.name}>{doc.name}</span>
                                    <span className={styles.statusText} style={{ color: doc.color }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: doc.color, animation: 'pulseRing 1.5s infinite alternate' }} />
                                        Atendiendo
                                    </span>
                                    <span className={styles.taskText}>
                                        {doc.currentTask}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className={styles.freeAvatar}>
                                    <span className={styles.zzz}>Z</span>
                                    <span className={styles.zzz}>z</span>
                                    <Coffee size={24} strokeWidth={1.5} />
                                </div>
                                <div className={styles.info}>
                                    <span className={styles.name}>{doc.name}</span>
                                    <span className={`${styles.statusText} ${styles.freeText}`}>
                                        En descanso
                                    </span>
                                    <span className={styles.taskText}>
                                        Disponible
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default DoctorStatusBoard;
