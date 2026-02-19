import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    X,
    User,
    Stethoscope,
    Image as ImageIcon,
    DollarSign,
    ClipboardList
} from 'lucide-react'
import { supabase, odontogramApi, budgetsApi, treatmentPlanApi } from '../lib/supabase'

import ClinicalHistoryGeneral from '../components/clinical-history/ClinicalHistoryGeneral'
import ClinicalHistoryOdontogram from '../components/clinical-history/ClinicalHistoryOdontogram'
import ClinicalHistoryGallery from '../components/clinical-history/ClinicalHistoryGallery'
import ClinicalHistoryBudget from '../components/clinical-history/ClinicalHistoryBudget'
import TreatmentPlans from '../components/clinical-history/TreatmentPlans'

import styles from '../components/clinical-history/ClinicalHistory.module.css'

export default function ClinicalHistoryPage() {
    const { patientId } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [historyId, setHistoryId] = useState(null)
    const [activeTab, setActiveTab] = useState('GENERAL')

    // Form Stats
    const [formData, setFormData] = useState({
        numeroHistoria: '',
        fechaIngreso: new Date().toISOString().split('T')[0],
        odontologo: 'Dr. Roberto Mendoza', // Could fetch from auth user

        // Datos personales
        apellidos: '',
        nombres: '',
        edad: '',
        sexo: '',
        fechaNacimiento: '',
        estadoCivil: '',
        direccion: '',
        distrito: '',
        ciudad: '',
        telefono: '',
        email: '',
        dni: '',
        ocupacion: '',
        lugarTrabajo: '',
        nombreApoderado: '',
        motivoConsulta: '',

        // Antecedentes
        antecedentes: {
            enfermedadCardiaca: false,
            enfermedadRenal: false,
            alergias: false,
            hemorragia: false,
            diabetes: false,
            hepatitis: false,
            presionAlta: false,
            epilepsia: false,
            vih: false,
            problemasHemorragicos: false,
            medicado: false,
            embarazada: false,
            cancer: false,
            tdah: false,
            otros: '',
        },

        // Diagnóstico (Texto) - Legacy
        examenRadiografico: '',
        diagnostico: '',
    })

    // Odontogram State (Single View Now)
    // We keep the structure for compatibility but will only use 'EVOLUTIVO' as the active one for editing
    const [odontogramState, setOdontogramState] = useState({
        INICIAL: { dientes: {}, especificaciones: '' },
        EVOLUTIVO: { dientes: {}, especificaciones: '' }
    })
    const [activeOdontogramType, setActiveOdontogramType] = useState('EVOLUTIVO') // Default active

    // Load Data
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true)

                // 1. Fetch Patient
                const { data: patient, error: patError } = await supabase
                    .from('patients')
                    .select('*')
                    .eq('id', patientId)
                    .single()

                if (patError) throw patError

                // 2. Fetch Existing History (Latest)
                const { data: history, error: histError } = await supabase
                    .from('clinical_histories')
                    .select('*')
                    .eq('patient_id', patientId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single()

                // 3. Fetch Odontogram Snapshots (Latest per type)
                try {
                    const [inicialSnap, evolutivoSnap] = await Promise.all([
                        odontogramApi.getLatest(patientId, 'INICIAL'),
                        odontogramApi.getLatest(patientId, 'EVOLUTIVO')
                    ]);

                    // Set Odontogram State
                    setOdontogramState({
                        INICIAL: inicialSnap ? inicialSnap.data : { dientes: {}, especificaciones: '' },
                        EVOLUTIVO: evolutivoSnap ? evolutivoSnap.data : (inicialSnap ? JSON.parse(JSON.stringify(inicialSnap.data)) : { dientes: {}, especificaciones: '' })
                    })
                } catch (snapError) {
                    console.warn('Error fetching snapshots, default to empty:', snapError);
                }

                // Prepare Form Data
                const newFormData = {
                    ...formData,
                    nombres: patient.first_name || '',
                    apellidos: patient.last_name || '',
                    dni: patient.dni || '',
                    telefono: patient.phone || '',
                    email: patient.email || '',
                    fechaNacimiento: patient.date_of_birth || '',
                    direccion: patient.address || '',
                }

                if (history && !histError) {
                    setHistoryId(history.id)
                    newFormData.numeroHistoria = history.history_number || history.numero_historia || newFormData.numeroHistoria
                    // Prioritize history specific fields
                    newFormData.motivoConsulta = history.notas || history.antecedentes?.motivoConsulta || ''
                    newFormData.examenRadiografico = history.examen_radiografico || ''
                    newFormData.diagnostico = history.diagnostico || ''

                    if (history.antecedentes) {
                        newFormData.antecedentes = { ...newFormData.antecedentes, ...history.antecedentes }
                        newFormData.ocupacion = history.antecedentes.ocupacion || newFormData.ocupacion
                        newFormData.lugarTrabajo = history.antecedentes.lugarTrabajo || newFormData.lugarTrabajo
                        newFormData.estadoCivil = history.antecedentes.estadoCivil || newFormData.estadoCivil
                        newFormData.nombreApoderado = history.antecedentes.nombreApoderado || newFormData.nombreApoderado
                    }
                } else {
                    newFormData.numeroHistoria = `HC-${new Date().getFullYear()}-${patientId.slice(0, 4).toUpperCase()}`
                }

                setFormData(newFormData)

            } catch (error) {
                console.error('Error loading data:', error)
            } finally {
                setLoading(false)
            }
        }

        if (patientId) loadData()
    }, [patientId])


    // Handlers
    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const updateAntecedente = (field, value) => {
        setFormData(prev => ({
            ...prev,
            antecedentes: { ...prev.antecedentes, [field]: value }
        }))
    }

    const handleOdontogramDataChange = (newData) => {
        setOdontogramState(prev => ({
            ...prev,
            [activeOdontogramType]: newData
        }))
    }

    // New Handler: Save General Data Only
    const handleSaveGeneral = async () => {
        try {
            setLoading(true)

            // 1. Update Patient Info
            await supabase.from('patients').update({
                first_name: formData.nombres,
                last_name: formData.apellidos,
                phone: formData.telefono,
                email: formData.email,
                dni: formData.dni,
                address: formData.direccion,
                date_of_birth: formData.fechaNacimiento,
                gender: formData.sexo,
            }).eq('id', patientId);

            // 2. Upsert Clinical History Record (Antecedents, etc)
            const historyPayload = {
                patient_id: patientId,
                numero_historia: formData.numeroHistoria,
                examen_radiografico: formData.examenRadiografico,
                diagnostico: formData.diagnostico,
                antecedentes: {
                    ...formData.antecedentes,
                    motivoConsulta: formData.motivoConsulta,
                    ocupacion: formData.ocupacion,
                    lugarTrabajo: formData.lugarTrabajo,
                    estadoCivil: formData.estadoCivil,
                    nombreApoderado: formData.nombreApoderado
                },
                updated_at: new Date().toISOString()
            }

            if (historyId) {
                await supabase.from('clinical_histories').update(historyPayload).eq('id', historyId)
            } else {
                const { data } = await supabase.from('clinical_histories').insert([historyPayload]).select().single()
                if (data) {
                    setHistoryId(data.id);
                }
            }

            alert('Datos generales guardados correctamente')

        } catch (error) {
            console.error('Error saving:', error)
            alert('Error al guardar: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading && !formData.nombres) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando Historia Clínica...</div>
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <div onClick={() => navigate('/pacientes')} style={{ cursor: 'pointer', marginRight: '8px' }}>
                        <X size={20} color="#64748b" />
                    </div>
                    <div>
                        <h1 className={styles.headerTitle}>Historia Clínica</h1>
                        <p className={styles.headerSubtitle}>
                            {formData.numeroHistoria} · {formData.nombres} {formData.apellidos}
                        </p>
                    </div>
                </div>
                {/* Global Actions Removed */}
            </header>

            {/* Tabs */}
            <div className={styles.tabsContainer}>
                <div
                    className={`${styles.tab} ${activeTab === 'GENERAL' ? styles.active : ''}`}
                    onClick={() => setActiveTab('GENERAL')}
                >
                    <User size={16} />
                    <span>General</span>
                </div>
                <div
                    className={`${styles.tab} ${activeTab === 'ODONTOGRAMA' ? styles.active : ''}`}
                    onClick={() => setActiveTab('ODONTOGRAMA')}
                >
                    <Stethoscope size={16} />
                    <span>Odontograma</span>
                </div>
                <div
                    className={`${styles.tab} ${activeTab === 'PLAN_TRATAMIENTO' ? styles.active : ''}`}
                    onClick={() => setActiveTab('PLAN_TRATAMIENTO')}
                >
                    <ClipboardList size={16} />
                    <span>Planes de Tratamiento</span>
                </div>
                <div
                    className={`${styles.tab} ${activeTab === 'IMAGENES' ? styles.active : ''}`}
                    onClick={() => setActiveTab('IMAGENES')}
                >
                    <ImageIcon size={16} />
                    <span>Imágenes Generales</span>
                </div>

            </div>

            {/* Content Area */}
            <div className={styles.contentTab}>
                {activeTab === 'GENERAL' && (
                    <div className={styles.content}>
                        <ClinicalHistoryGeneral
                            formData={formData}
                            updateField={updateField}
                            updateAntecedente={updateAntecedente}
                            onSave={handleSaveGeneral}
                        />
                    </div>
                )}

                {activeTab === 'ODONTOGRAMA' && (
                    <div className={styles.content}>
                        <ClinicalHistoryOdontogram
                            patientId={patientId}
                            data={odontogramState[activeOdontogramType]}
                            onDataChange={handleOdontogramDataChange}
                            // We force 'EVOLUTIVO' mode logic internally or just ignore type switching
                            activeType={activeOdontogramType}
                            onTypeChange={setActiveOdontogramType}
                        // onCreateBudget is replaced/augmented by internal "Save Plan" logic which might link to budget
                        />
                    </div>
                )}

                {activeTab === 'PLAN_TRATAMIENTO' && (
                    <div className={styles.content}>
                        <TreatmentPlans
                            patientId={patientId}
                            patientName={`${formData.nombres} ${formData.apellidos}`.trim()}
                            patientPhone={formData.telefono}
                        />
                    </div>
                )}

                {activeTab === 'IMAGENES' && (
                    <div className={styles.content}>
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <div className={styles.sectionTitle}>
                                    <div className={styles.iconBox} style={{ background: '#8b5cf6' }}>
                                        <ImageIcon size={18} />
                                    </div>
                                    Galería de Radiografías y Escaneos 3D
                                </div>
                            </div>
                            <div className={styles.sectionContent}>
                                <ClinicalHistoryGallery patientId={patientId} />
                            </div>
                        </div>
                    </div>
                )}


            </div>
        </div>
    )
}
