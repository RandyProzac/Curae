import React, { useState, useEffect, useMemo } from 'react';
import {
    Calendar,
    Clock,
    ChevronLeft,
    ChevronRight,
    Plus,
    Search,
    MapPin,
    User,
    CalendarDays,

    Filter,
    Trash2,
    AlertTriangle,
    Info
} from 'lucide-react';
import { supabase, doctorsApi, servicesApi, patientsApi, appointmentsApi } from '../lib/supabase';
import TimeCombobox from '../components/appointments/TimeCombobox';
import ServiceSelector from '../components/appointments/ServiceSelector';
import { APPOINTMENT_STATUS, getStatusConfig } from '../utils/constants';

// Fallback data
const fallbackDoctors = [
    { id: 1, name: 'Dr. Roberto Mendoza', specialty: 'Odontología General', color: '#14b8a6' },
    { id: 2, name: 'Dra. María García', specialty: 'Ortodoncia', color: '#f59e0b' },
    { id: 3, name: 'Dr. Carlos López', specialty: 'Endodoncia', color: '#3b82f6' },
];

let sessionCache = {
    doctors: null,
    services: null,
    patients: null,
    appointments: null,
    events: null,
    timestamp: 0
};

const AppointmentsPage = () => {
    // --- STATE ---
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('month');
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState('cita');
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [createNewPatient, setCreateNewPatient] = useState(false);

    // Custom Alert State
    const [alertState, setAlertState] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'alert', // 'alert' | 'confirm'
        onConfirm: null
    });

    const showAlert = (message, title = 'Aviso', type = 'alert', onConfirm = null) => {
        setAlertState({ isOpen: true, title, message, type, onConfirm });
    };

    // Data State
    const [doctorsData, setDoctorsData] = useState(sessionCache.doctors || fallbackDoctors);
    const [servicesData, setServicesData] = useState(sessionCache.services || []);
    const [patientsData, setPatientsData] = useState(sessionCache.patients || []);
    const [appointments, setAppointments] = useState(sessionCache.appointments || []);
    const [events, setEvents] = useState(sessionCache.events || []); // New Events State
    const [loading, setLoading] = useState(!sessionCache.appointments);

    // Autocomplete State
    const [patientSearchTerm, setPatientSearchTerm] = useState('');
    const [showPatientSuggestions, setShowPatientSuggestions] = useState(false);

    // Filter State
    const [selectedDoctors, setSelectedDoctors] = useState([]); // IDs of selected doctors
    const [showEvents, setShowEvents] = useState(true); // Toggle generic events
    const [showFilterPopup, setShowFilterPopup] = useState(false); // Toggle filter menu

    // Form State - Appointment
    const [newAppointment, setNewAppointment] = useState({
        patientId: '',
        doctorId: '',
        serviceId: '',
        motivo: '',
        date: '',
        startTime: '09:00',
        endTime: '09:30',
        consultorio: '',
        frecuencia: 'No se repite',
        notes: '',
        newPatientName: '',
        newPatientLastName: '',
        newPatientPhone: '',
        newPatientDni: '',
        newPatientAddress: '',
        newPatientEmail: ''
    });

    const [isDniLoading, setIsDniLoading] = useState(false); // Loading state for DNI

    const handleDniSearch = async () => {
        if (!newAppointment.newPatientDni || newAppointment.newPatientDni.length !== 8) {
            showAlert('Por favor ingrese un DNI válido de 8 dígitos.', 'DNI Inválido', 'alert');
            return;
        }

        setIsDniLoading(true);
        try {
            const response = await fetch(`https://www.static.pe/test/dni-api.php?dni=${newAppointment.newPatientDni}`);
            const data = await response.json();

            if (data.error) {
                showAlert('DNI no encontrado.', 'Búsqueda Fallida', 'alert');
            } else {
                setNewAppointment(prev => ({
                    ...prev,
                    newPatientName: toTitleCase(data.nombres),
                    newPatientLastName: toTitleCase(`${data.apellido_paterno} ${data.apellido_materno}`)
                }));
            }
        } catch (error) {
            console.error('Error fetching DNI:', error);
            showAlert('Error al consultar DNI. Intente nuevamente.', 'Error de Conexión', 'alert');
        } finally {
            setIsDniLoading(false);
        }
    };

    // Form State - Event
    const [newEvent, setNewEvent] = useState({
        doctorId: '',
        title: '',
        color: '#ef4444', // Default Red Warning
        allDay: false,
        startTime: '08:00',
        endTime: '08:30',
        frequency: 'No se repite',
        notes: ''
    });

    // --- DATA FETCHING (Supabase) ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!sessionCache.appointments) setLoading(true);

                // Parallel fetching including EVENTS
                const [docsRes, servsRes, patsRes, aptsRes, eventsRes] = await Promise.all([
                    supabase.from('doctors').select('*').order('name'),
                    supabase.from('services').select('*').order('name'),
                    supabase.from('patients').select('*').order('last_name'),
                    supabase.from('appointments').select('*, patient:patients(*), doctor:doctors(*), service:services(name)').order('date', { terminating: false }).order('start_time'),
                    supabase.from('events').select('*')
                ]);

                const finalDoctors = docsRes.data?.length ? docsRes.data : fallbackDoctors;

                const finalAppointments = (aptsRes.data || []).map(apt => ({
                    id: apt.id,
                    patient: apt.patient ? `${apt.patient.first_name} ${apt.patient.last_name}` : 'Sin paciente',
                    patientId: apt.patient_id, // Added for Edit Mode
                    // Logic: Show Service Name if available, otherwise Motivo, otherwise 'Consulta'
                    treatment: apt.service?.name || apt.motivo || 'Consulta',
                    date: apt.date,
                    startTime: apt.start_time?.slice(0, 5) || '09:00',
                    duration: calculateDuration(apt.start_time, apt.end_time),
                    doctorId: apt.doctor_id,
                    serviceId: apt.service_id, // Added for Edit Mode
                    notes: apt.notes,
                    status: apt.status || 'pending',
                    statusUpdatedAt: apt.status_updated_at,
                    statusUpdatedBy: apt.status_updated_by,
                    type: 'appointment'
                }));

                const finalEvents = (eventsRes.data || []).map(evt => ({
                    id: evt.id,
                    title: evt.title || 'Evento',
                    date: evt.date,
                    startTime: evt.start_time?.slice(0, 5) || '08:00',
                    duration: calculateDuration(evt.start_time, evt.end_time),
                    doctorId: evt.doctor_id,
                    color: '#ef4444', // Force Red Warning
                    notes: evt.notes, // Added for Edit Mode
                    type: 'event'
                }));

                // Init Selected Doctors (All selected by default)
                if (!sessionCache.doctors) {
                    setSelectedDoctors(finalDoctors.map(d => d.id));
                } else {
                    // Keep existing selection if reloading, or re-init if needed. 
                    // For simplicity, re-init to ensure new doctors appear.
                    setSelectedDoctors(finalDoctors.map(d => d.id));
                }

                setDoctorsData(finalDoctors);
                setServicesData(servsRes.data || []);
                setPatientsData(patsRes.data || []);
                setAppointments(finalAppointments);
                setEvents(finalEvents);

                sessionCache = {
                    doctors: finalDoctors,
                    services: servsRes.data || [],
                    patients: patsRes.data || [],
                    appointments: finalAppointments,
                    events: finalEvents,
                    timestamp: Date.now()
                };

            } catch (err) {
                console.error('Error fetching data:', err);
                // Fallback used if events table missing
                setEvents([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // --- HELPERS ---
    const toTitleCase = (str) => {
        if (!str) return '';
        return str.toLowerCase().replace(/(?:^|\s|["'([{])+\S/g, match => match.toUpperCase());
    };

    const calculateDuration = (start, end) => {
        if (!start || !end) return 30;
        const [h1, m1] = start.split(':').map(Number);
        const [h2, m2] = end.split(':').map(Number);
        return (h2 * 60 + m2) - (h1 * 60 + m1);
    };

    const calculateEndTime = (startTime, duration) => {
        if (!startTime) return '';
        const [h, m] = startTime.split(':').map(Number);
        const totalMinutes = h * 60 + m + duration;
        const newH = Math.floor(totalMinutes / 60);
        const newM = totalMinutes % 60;
        return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
    };

    const getDoctorColor = (id) => {
        const doc = doctorsData.find(d => d.id == id);
        if (!doc) return '#cbd5e1';

        // Prevent doctors from using Red (reserved for Events)
        const c = doc.color.toLowerCase();
        // Check for specific red hex codes or "red" string
        if (c.includes('#ef4444') || c.includes('#dc2626') || c.includes('#b91c1c') || c.includes('#f87171') || c === '#ff0000' || c === 'red') {
            return '#6366f1'; // Return Indigo if conflict
        }
        return doc.color;
    };

    const isToday = (date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    // --- CALENDAR LOGIC ---
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days = [];
        // Add padding for previous month
        const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Start Monday
        for (let i = startPadding; i > 0; i--) {
            const d = new Date(year, month, 1 - i);
            days.push(d);
        }

        // Current month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }

        // Add padding for next month to complete the grid
        const endPadding = lastDay.getDay() === 0 ? 0 : 7 - lastDay.getDay();
        for (let i = 1; i <= endPadding; i++) {
            days.push(new Date(year, month + 1, i));
        }

        return days;
    };

    const weekDates = useMemo(() => {
        const dates = [];
        const start = new Date(currentDate);
        const day = start.getDay() || 7; // 1 (Mon) to 7 (Sun)
        start.setDate(start.getDate() - day + 1); // Monday
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            dates.push(d);
        }
        return dates;
    }, [currentDate]);

    // Unified Getter
    const getItemsForDate = (date) => {
        const dateStr = date.toISOString().split('T')[0];

        const apts = appointments.filter(a =>
            a.date === dateStr &&
            selectedDoctors.includes(a.doctorId)
        );

        const evts = events.filter(e =>
            e.date === dateStr &&
            (e.doctorId ? selectedDoctors.includes(e.doctorId) : showEvents) // Filter by doctor OR showEvents for generic
        );

        return [...apts, ...evts];
    };

    // --- LAYOUT ALGORITHM ---
    const calculateEventLayout = (items) => {
        // 1. Sort by start time
        const sorted = [...items].sort((a, b) => a.startTime.localeCompare(b.startTime));

        // 2. Expand events with minute values
        const expanded = sorted.map(item => {
            const [h, m] = item.startTime.split(':').map(Number);
            const startMin = h * 60 + m;
            return { ...item, startMin, endMin: startMin + item.duration };
        });

        // 3. Build columns
        const columns = [];
        let lastEventEnding = null;

        expanded.forEach(event => {
            if (lastEventEnding !== null && event.startMin >= lastEventEnding) {
                packEvents(columns);
                columns.length = 0;
                lastEventEnding = null;
            }

            let placed = false;
            for (let i = 0; i < columns.length; i++) {
                const col = columns[i];
                if (!col[col.length - 1] || col[col.length - 1].endMin <= event.startMin) {
                    col.push(event);
                    placed = true;
                    break;
                }
            }

            if (!placed) {
                columns.push([event]);
            }

            if (lastEventEnding === null || event.endMin > lastEventEnding) {
                lastEventEnding = event.endMin;
            }
        });

        if (columns.length > 0) {
            packEvents(columns);
        }

        return expanded;
    };

    const packEvents = (columns) => {
        const numCols = columns.length;
        columns.forEach((col, i) => {
            col.forEach(event => {
                event.colIndex = i;
                event.colSpan = numCols;

                // Cascading layout for dense overlaps (4+)
                if (numCols <= 3) {
                    // Equal division (current behavior)
                    event.layoutWidth = 96 / numCols;
                    event.layoutLeft = (i * 96) / numCols;
                } else {
                    // Cascading: each event covers ~55-65% width, offset progressively
                    const minWidth = Math.max(35, 96 / Math.min(numCols, 3));
                    const offsetStep = (96 - minWidth) / (numCols - 1);
                    event.layoutWidth = minWidth;
                    event.layoutLeft = i * offsetStep;
                }
            });
        });
    };

    const getAppointmentsForDate = (date) => calculateEventLayout(getItemsForDate(date));

    // --- HANDLERS ---
    const handlePrev = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') newDate.setMonth(newDate.getMonth() - 1);
        else newDate.setDate(newDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + 1);
        else newDate.setDate(newDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    const handleEdit = () => {
        if (!selectedAppointment) return;

        if (selectedAppointment.type === 'event') {
            setActiveTab('evento');
            setNewEvent({
                id: selectedAppointment.id,
                doctorId: selectedAppointment.doctorId || '',
                title: selectedAppointment.title,
                color: selectedAppointment.color,
                date: selectedAppointment.date,
                startTime: selectedAppointment.startTime,
                endTime: calculateEndTime(selectedAppointment.startTime, selectedAppointment.duration),
                notes: selectedAppointment.notes || '',
                frequency: 'No se repite'
            });
            setNewAppointment(prev => ({ ...prev, date: selectedAppointment.date })); // Sync context
        } else {
            setActiveTab('cita');
            setNewAppointment({
                id: selectedAppointment.id,
                patientId: selectedAppointment.patientId,
                doctorId: selectedAppointment.doctorId || '',
                serviceId: selectedAppointment.serviceId || '',
                motivo: selectedAppointment.treatment,
                date: selectedAppointment.date,
                startTime: selectedAppointment.startTime,
                endTime: calculateEndTime(selectedAppointment.startTime, selectedAppointment.duration),
                notes: selectedAppointment.notes || '',
                consultorio: '',
                frecuencia: 'No se repite',
                newPatientLastName: '',
                newPatientPhone: ''
            });
            // Set search term for autocomplete
            const patientName = selectedAppointment.patient || '';
            setPatientSearchTerm(patientName);
        }
        setShowModal(true);
        setSelectedAppointment(null);
    };

    const handleStatusChange = async (appointmentId, newStatus) => {
        try {
            // Optimistic UI Update
            setAppointments(prev => prev.map(apt =>
                apt.id === appointmentId ? { ...apt, status: newStatus } : apt
            ));

            // Update in Supabase
            const updatedData = await appointmentsApi.updateStatus(appointmentId, newStatus, 'Usuario');

            // Sync with server response
            const formatted = {
                id: updatedData.id,
                patient: updatedData.patient ? `${updatedData.patient.first_name} ${updatedData.patient.last_name}` : 'Sin paciente',
                patientId: updatedData.patient_id,
                treatment: updatedData.motivo || 'Consulta',
                date: updatedData.date,
                startTime: updatedData.start_time.slice(0, 5),
                duration: calculateDuration(updatedData.start_time, updatedData.end_time),
                doctorId: updatedData.doctor_id,
                serviceId: updatedData.service_id,
                notes: updatedData.notes,
                status: updatedData.status,
                statusUpdatedAt: updatedData.status_updated_at,
                statusUpdatedBy: updatedData.status_updated_by,
                type: 'appointment'
            };

            setAppointments(prev => prev.map(a => a.id === appointmentId ? formatted : a));

            // Update selected appointment if it's still open
            if (selectedAppointment?.id === appointmentId) {
                setSelectedAppointment(formatted);
            }

            showAlert(`Estado actualizado a: ${getStatusConfig(newStatus).label}`, 'Éxito', 'alert');
        } catch (err) {
            console.error('Error updating status:', err);
            showAlert('Error al actualizar estado: ' + err.message, 'Error', 'alert');
            // Revert optimistic update on error
            window.location.reload();
        }
    };

    const handleDeleteAppointment = async (id) => {
        showAlert(
            '¿Estás seguro de eliminar esta cita? Esta acción no se puede deshacer.',
            'Eliminar Cita',
            'confirm',
            async () => {
                try {
                    const { error } = await supabase.from('appointments').delete().eq('id', id);
                    if (error) throw error;

                    setAppointments(prev => prev.filter(a => a.id !== id));
                    setShowModal(false);
                    showAlert('Cita eliminada correctamente', 'Éxito');
                } catch (err) {
                    console.error('Error deleting appointment:', err);
                    showAlert('Error al eliminar cita: ' + err.message, 'Error');
                }
            }
        );
    };

    const handleDeleteEvent = async (id) => {
        showAlert(
            '¿Estás seguro de eliminar este evento? Esta acción no se puede deshacer.',
            'Eliminar Evento',
            'confirm',
            async () => {
                try {
                    const { error } = await supabase.from('events').delete().eq('id', id);
                    if (error) throw error;

                    setEvents(prev => prev.filter(e => e.id !== id));
                    setShowModal(false);
                    showAlert('Evento eliminado correctamente', 'Éxito');
                } catch (err) {
                    console.error('Error deleting event:', err);
                    showAlert('Error al eliminar evento: ' + err.message, 'Error');
                }
            }
        );
    };



    // --- VALIDATION HELPER ---
    const checkConstraints = (doctorId, date, start, end, excludeId = null) => {
        // 1. Past Date Check (Only for new entries)
        if (!excludeId) {
            const now = new Date();
            const startDateTime = new Date(`${date}T${start}`);
            if (startDateTime < now) {
                return 'No se pueden crear citas ni eventos en el pasado.';
            }
        }

        // 2. Overlap Check (Double Booking)
        if (!doctorId) return null; // Events without doctor don't block?

        const sMin = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);
        const eMin = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);

        const conflict = [...appointments, ...(events || [])].find(item => {
            if (item.id === excludeId) return false;
            if (item.date !== date) return false;
            // Handle events with no doctor assigned? Usually they don't block specific doctors.
            // But if item has NO doctor, does it block everyone? Assuming generic events don't block.
            if (item.doctorId && item.doctorId !== doctorId) return false;

            const iSMin = parseInt(item.startTime.split(':')[0]) * 60 + parseInt(item.startTime.split(':')[1]);
            const iEMin = iSMin + item.duration;

            return (sMin < iEMin && eMin > iSMin);
        });

        if (conflict) {
            return `El doctor seleccionado ya tiene una actividad programada en este horario (${conflict.startTime} - ${conflict.type === 'event' ? 'Evento' : 'Cita'}).`;
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let finalPatientId = newAppointment.patientId;

            // 1. Create Patient if needed
            if (createNewPatient) {
                // Validation
                if (!newAppointment.newPatientName || !newAppointment.newPatientLastName || !newAppointment.newPatientPhone) {
                    showAlert('Por favor complete los campos obligatorios del paciente: Nombre, Apellidos y Teléfono.', 'Campos Requeridos');
                    return;
                }
            }

            // 2. Global Constraints (Past Date & Double Booking)
            const validationError = checkConstraints(
                newAppointment.doctorId,
                newAppointment.date,
                newAppointment.startTime,
                newAppointment.endTime,
                newAppointment.id
            );
            if (validationError) {
                showAlert(validationError, 'Conflicto de Agenda');
                return;
            }

            if (createNewPatient) {

                const { data: newPat, error: patError } = await supabase
                    .from('patients')
                    .insert([{
                        first_name: newAppointment.newPatientName,
                        last_name: newAppointment.newPatientLastName,
                        phone: newAppointment.newPatientPhone,
                        date_of_birth: '2000-01-01',
                        address: newAppointment.newPatientAddress || null,
                        email: newAppointment.newPatientEmail || null,
                        dni: newAppointment.newPatientDni || null
                    }])
                    .select()
                    .single();
                if (patError) throw patError;
                finalPatientId = newPat.id;
                setPatientsData([...patientsData, newPat]);
            }

            const payload = {
                patient_id: finalPatientId,
                doctor_id: newAppointment.doctorId,
                service_id: newAppointment.serviceId || null,
                date: newAppointment.date,
                start_time: newAppointment.startTime,
                end_time: newAppointment.endTime,
                motivo: newAppointment.motivo,
                notes: newAppointment.notes,
                status: 'pending'
            };

            let savedData;

            if (newAppointment.id) {
                // UPDATE
                const { data, error } = await supabase
                    .from('appointments')
                    .update(payload)
                    .eq('id', newAppointment.id)
                    .select('*, patient:patients(*), service:services(name)')
                    .single();
                if (error) throw error;
                savedData = data;
                showAlert('Cita actualizada correctamente', 'Éxito', 'alert');
            } else {
                // INSERT
                const { data, error } = await supabase
                    .from('appointments')
                    .insert([payload])
                    .select('*, patient:patients(*), service:services(name)')
                    .single();
                if (error) throw error;
                savedData = data;
                showAlert('Cita guardada correctamente', 'Éxito', 'alert');
            }

            // Sync State
            const formatted = {
                id: savedData.id,
                patient: savedData.patient ? `${savedData.patient.first_name} ${savedData.patient.last_name}` : 'Nuevo Paciente',
                patientId: savedData.patient_id,
                treatment: savedData.service?.name || savedData.motivo || 'Consulta',
                date: savedData.date,
                startTime: savedData.start_time.slice(0, 5),
                duration: calculateDuration(savedData.start_time, savedData.end_time),
                doctorId: savedData.doctor_id,
                serviceId: savedData.service_id,
                notes: savedData.notes,
                status: savedData.status || 'pending',
                statusUpdatedAt: savedData.status_updated_at,
                statusUpdatedBy: savedData.status_updated_by,
                type: 'appointment'
            };

            if (newAppointment.id) {
                setAppointments(appointments.map(a => a.id === savedData.id ? formatted : a));
            } else {
                setAppointments([...appointments, formatted]);
            }

            setShowModal(false);
            setCreateNewPatient(false);
            setNewAppointment({ ...newAppointment, id: null, patientId: '', doctorId: '', motivo: '' });
        } catch (err) {
            console.error(err);
            showAlert('Error al guardar: ' + err.message, 'Error');
        }
    };

    const handleEventSubmit = async (e) => {
        e.preventDefault();
        try {
            const evtPayload = {
                doctor_id: newEvent.doctorId || null,
                title: newEvent.title,
                color: newEvent.color,
                start_time: newEvent.startTime,
                end_time: newEvent.endTime,
                date: newEvent.date || new Date().toISOString().split('T')[0],
                notes: newEvent.notes
            };

            // Validation
            const validationError = checkConstraints(
                evtPayload.doctor_id,
                evtPayload.date,
                evtPayload.start_time,
                evtPayload.end_time,
                newEvent.id
            );
            if (validationError) {
                showAlert(validationError, 'Conflicto de Agenda', 'alert');
                return;
            }

            let savedEvt;

            if (newEvent.id) {
                // UPDATE
                const { data, error } = await supabase.from('events').update(evtPayload).eq('id', newEvent.id).select().single();
                if (error) throw error;
                savedEvt = data;
                showAlert('Evento actualizado correctamente', 'Éxito', 'alert');
            } else {
                // INSERT
                const { data, error } = await supabase.from('events').insert([evtPayload]).select().single();
                if (error) throw error;
                savedEvt = data;
                showAlert('Evento creado correctamente', 'Éxito', 'alert');
            }

            const formattedEvt = {
                id: savedEvt.id,
                title: savedEvt.title,
                date: savedEvt.date,
                startTime: savedEvt.start_time.slice(0, 5),
                duration: calculateDuration(savedEvt.start_time, savedEvt.end_time),
                doctorId: savedEvt.doctor_id,
                color: savedEvt.color,
                notes: savedEvt.notes,
                type: 'event'
            };

            if (newEvent.id) {
                setEvents(events.map(e => e.id === savedEvt.id ? formattedEvt : e));
            } else {
                setEvents([...events, formattedEvt]);
            }
            setShowModal(false);
            setNewEvent({ ...newEvent, id: null, title: '' }); // Reset ID
        } catch (err) {
            console.error(err);
            showAlert('Error al crear/editar evento: ' + err.message, 'Error', 'alert');
        }
    };

    // --- STYLES (Restored Premium CSS) ---
    const styles = {
        container: { display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' },
        header: { padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        title: { fontSize: '24px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px' },
        navBtn: { padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' },
        currentDate: { fontSize: '16px', fontWeight: '600', color: '#334155', minWidth: '150px', textAlign: 'center' },
        viewToggle: { display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '10px', gap: '4px' },
        toggleBtn: (active) => ({
            padding: '6px 12px', borderRadius: '6px', border: 'none', fontSize: '13px', fontWeight: '500', cursor: 'pointer',
            background: active ? 'white' : 'transparent', color: active ? '#0f766e' : '#64748b', boxShadow: active ? '0 1px 2px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s'
        }),
        monthGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', flex: 1, overflow: 'auto' },
        dayHeader: { padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '13px', color: '#64748b', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' },
        dayCell: { minHeight: '120px', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '8px', cursor: 'pointer', transition: 'background 0.2s' },
        dayNum: (today) => ({
            width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: today ? '#0f766e' : 'transparent', color: today ? 'white' : '#1e293b', fontWeight: '600', fontSize: '14px', marginBottom: '6px'
        }),
        aptChip: (color) => ({
            padding: '4px 8px', borderRadius: '6px', background: `${color}20`, borderLeft: `3px solid ${color}`,
            fontSize: '11px', marginBottom: '4px', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#334155'
        }),
        floatingBtn: {
            position: 'absolute', bottom: '32px', right: '32px', width: '56px', height: '56px', borderRadius: '50%',
            background: '#0f766e', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(15, 118, 110, 0.4)', cursor: 'pointer', zIndex: 50
        }
    };


    // --- TEST DATA GENERATOR (Specific for Feb 14th Cascade Test) ---
    const generateTestData = () => {
        showAlert('¿Generar 4 citas de prueba simultáneas el Sábado 14 de Febrero a las 14:00?', 'Confirmar Prueba Cascada', 'confirm', async () => {
            setLoading(true);
            try {
                const availableDoctors = doctorsData.length > 0 ? doctorsData : fallbackDoctors;
                const doctorsForTest = Array.from({ length: 4 }, (_, i) => availableDoctors[i % availableDoctors.length]);

                const availablePatients = patientsData.length > 0 ? patientsData : [{ id: 1 }];
                const patientsForTest = Array.from({ length: 4 }, (_, i) => availablePatients[i % availablePatients.length]);

                const statusOptions = ['pending', 'confirmed', 'attended', 'cancelled'];

                const testAppointments = doctorsForTest.map((doc, i) => ({
                    doctor_id: doc.id,
                    patient_id: patientsForTest[i].id,
                    date: '2026-02-14',
                    start_time: '14:00',
                    end_time: '15:00',
                    motivo: `Prueba Cascada ${i + 1}`,
                    notes: 'Generado para probar layout en cascada',
                    status: statusOptions[i % statusOptions.length],
                    service_id: null
                }));

                const { error } = await supabase.from('appointments').insert(testAppointments);
                if (error) throw error;

                showAlert('4 citas generadas exitosamente. Recargando...', 'Datos Creados', 'alert');
                setTimeout(() => window.location.reload(), 1500);
            } catch (err) {
                console.error(err);
                showAlert('Error generando datos: ' + err.message, 'Error', 'alert');
            } finally {
                setLoading(false);
            }
        });
    };

    const clearTestData = () => {
        showAlert('¿BORRAR todas las citas con motivo "Cita de Prueba..."?', 'Confirmar Borrado', 'confirm', async () => {
            setLoading(true);
            try {
                const { error } = await supabase
                    .from('appointments')
                    .delete()
                    .ilike('motivo', 'Cita de Prueba%');

                if (error) throw error;
                showAlert('Datos de prueba eliminados. Recargando...', 'Datos Eliminados', 'alert');
                setTimeout(() => window.location.reload(), 1500);
            } catch (err) {
                console.error(err);
                showAlert('Error borrando datos: ' + err.message, 'Error', 'alert');
            } finally {
                setLoading(false);
            }
        });
    };

    const handleOpenNewAppointment = (overrides = {}) => {
        // If it's a React SyntheticEvent, treat it as empty
        const initial = (overrides && overrides.nativeEvent) ? {} : overrides;

        // Block past dates
        const today = new Date().toISOString().split('T')[0];
        const targetDate = initial.date || currentDate.toISOString().split('T')[0];
        if (targetDate < today) {
            showAlert('No se pueden crear citas en fechas pasadas.', '⚠️ Fecha pasada', 'alert');
            return;
        }

        // Reset Appointment Form
        setNewAppointment({
            patientId: '',
            doctorId: '',
            serviceId: '',
            motivo: '',
            date: currentDate.toISOString().split('T')[0],
            startTime: '09:00',
            endTime: '09:30',
            consultorio: '',
            frecuencia: 'No se repite',
            notes: '',
            newPatientName: '',
            newPatientLastName: '',
            newPatientPhone: '',
            newPatientDni: '',
            newPatientAddress: '',
            newPatientEmail: '',
            ...initial
        });

        // Reset Event Form
        setNewEvent({
            doctorId: '',
            title: '',
            color: '#ef4444',
            allDay: false,
            startTime: '08:00',
            endTime: '08:30',
            frequency: 'No se repite',
            notes: '',
            date: currentDate.toISOString().split('T')[0],
            ...initial
        });

        setPatientSearchTerm('');
        setActiveTab('cita');
        setSelectedAppointment(null);
        setShowModal(true);
    };

    return (
        <div style={styles.container}>
            {/* DEV TOOLS */}
            <div style={{ position: 'fixed', bottom: '10px', left: '10px', zIndex: 9999, display: 'flex', gap: '8px', opacity: 0.5 }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                onMouseLeave={(e) => e.currentTarget.style.opacity = 0.5}
            >
                <button onClick={generateTestData} style={{ fontSize: '10px', padding: '4px 8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    ⚡ Generar Test Data
                </button>
                <button onClick={clearTestData} style={{ fontSize: '10px', padding: '4px 8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    🗑️ Borrar Test Data
                </button>
            </div>

            {/* Header */}
            <div style={styles.header}>
                <div style={styles.title}>
                    <CalendarDays size={28} color="#0f766e" />
                    Agenda Médica
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button style={styles.navBtn} onClick={handlePrev}><ChevronLeft size={18} /></button>
                        <span style={styles.currentDate}>
                            {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
                        </span>
                        <button style={styles.navBtn} onClick={handleNext}><ChevronRight size={18} /></button>
                    </div>

                    {/* Doctor Filter */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowFilterPopup(!showFilterPopup)}
                            style={{
                                ...styles.navBtn,
                                background: showFilterPopup || selectedDoctors.length !== doctorsData.length ? '#f0fdfa' : 'white',
                                borderColor: showFilterPopup || selectedDoctors.length !== doctorsData.length ? '#0f766e' : '#e2e8f0',
                                color: showFilterPopup || selectedDoctors.length !== doctorsData.length ? '#0f766e' : 'inherit'
                            }}
                            title="Filtrar por especialistas"
                        >
                            <Filter size={18} />
                        </button>

                        {showFilterPopup && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '8px',
                                width: '280px',
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                zIndex: 100,
                                padding: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '600', fontSize: '14px', color: '#1e293b' }}>
                                    <span>Especialistas</span>
                                    <button
                                        onClick={() => {
                                            if (selectedDoctors.length === doctorsData.length) {
                                                setSelectedDoctors([]);
                                            } else {
                                                setSelectedDoctors(doctorsData.map(d => d.id));
                                            }
                                        }}
                                        style={{ color: '#0f766e', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                                    >
                                        {selectedDoctors.length === doctorsData.length ? 'Desmarcar todos' : 'Marcar todos'}
                                    </button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                                    {/* Generic Events Checkbox */}
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#334155', cursor: 'pointer', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                                        <input
                                            type="checkbox"
                                            checked={showEvents}
                                            onChange={() => setShowEvents(!showEvents)}
                                            style={{ accentColor: '#ef4444', cursor: 'pointer' }}
                                        />
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', border: '1px solid #fee2e2' }} />
                                        Eventos Generales
                                    </label>

                                    {doctorsData.map(doc => (
                                        <label key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#334155', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedDoctors.includes(doc.id)}
                                                onChange={() => {
                                                    if (selectedDoctors.includes(doc.id)) {
                                                        setSelectedDoctors(selectedDoctors.filter(id => id !== doc.id));
                                                    } else {
                                                        setSelectedDoctors([...selectedDoctors, doc.id]);
                                                    }
                                                }}
                                                style={{ accentColor: doc.color, cursor: 'pointer' }}
                                            />
                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: doc.color }} />
                                            {doc.name}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={styles.viewToggle}>
                        <button style={styles.toggleBtn(viewMode === 'day')} onClick={() => setViewMode('day')}>Día</button>
                        <button style={styles.toggleBtn(viewMode === 'week')} onClick={() => setViewMode('week')}>Semana</button>
                        <button style={styles.toggleBtn(viewMode === 'month')} onClick={() => setViewMode('month')}>Mes</button>
                    </div>

                    <button
                        onClick={handleOpenNewAppointment}
                        style={{ padding: '8px 16px', background: '#0f766e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}
                    >
                        + Nueva Cita
                    </button>
                </div>
            </div>

            {/* Grid Content */}
            {viewMode === 'month' ? (
                /* MONTH VIEW (Unchanged) */
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
                        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                            <div key={d} style={styles.dayHeader}>{d}</div>
                        ))}
                    </div>
                    <div style={styles.monthGrid}>
                        {getDaysInMonth(currentDate).map((date, idx) => (
                            <div key={idx} style={styles.dayCell} onClick={() => { setCurrentDate(date); setViewMode('day'); }}>
                                <div style={styles.dayNum(isToday(date))}>{date.getDate()}</div>
                                {getAppointmentsForDate(date).slice(0, 3).map(apt => (
                                    <div key={apt.id} style={styles.aptChip(apt.type === 'event' ? apt.color : getDoctorColor(apt.doctorId))} onClick={(e) => { e.stopPropagation(); setSelectedAppointment(apt); }}>
                                        {apt.type === 'appointment' && (
                                            <span style={{ marginRight: '4px', fontSize: '10px' }}>
                                                {getStatusConfig(apt.status).icon}
                                            </span>
                                        )}
                                        <span style={{ fontWeight: '600' }}>{apt.startTime}</span> {apt.type === 'event' ? apt.title : apt.patient}
                                    </div>
                                ))}
                                {getAppointmentsForDate(date).length > 3 && (
                                    <div style={{ fontSize: '10px', color: '#64748b', paddingLeft: '4px' }}>
                                        + {getAppointmentsForDate(date).length - 3} más
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ) : viewMode === 'day' ? (
                /* REFURBISHED DAY VIEW (Strip + List) */
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: '#f8fafc', padding: '24px' }}>

                    {/* 1. Date Strip */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
                        {weekDates.map((date, i) => {
                            const isSelected = date.getDate() === currentDate.getDate();
                            return (
                                <button key={i}
                                    onClick={() => setCurrentDate(date)}
                                    style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        width: '60px', height: '70px',
                                        borderRadius: '16px',
                                        border: isSelected ? 'none' : '1px solid #e2e8f0',
                                        background: isSelected ? '#0f766e' : 'white',
                                        color: isSelected ? 'white' : '#64748b',
                                        cursor: 'pointer',
                                        boxShadow: isSelected ? '0 4px 12px rgba(15, 118, 110, 0.3)' : '0 2px 4px rgba(0,0,0,0.02)',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <span style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>
                                        {date.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')}
                                    </span>
                                    <span style={{ fontSize: '18px', fontWeight: '700' }}>
                                        {date.getDate()}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* 2. Appointment List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                        {getAppointmentsForDate(currentDate).length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                <p>No hay citas programadas para este día.</p>
                                <button onClick={handleOpenNewAppointment} style={{ color: '#0f766e', fontWeight: '600', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                    + Agendar una cita
                                </button>
                            </div>
                        ) : (
                            getAppointmentsForDate(currentDate).map(apt => (
                                <div key={apt.id}
                                    style={{
                                        display: 'flex', alignItems: 'center',
                                        background: 'white', borderRadius: '16px', padding: '16px 24px',
                                        boxShadow: '0 2px 6px -1px rgba(0,0,0,0.05)',
                                        border: '1px solid #f1f5f9', cursor: 'pointer',
                                        borderLeft: apt.type === 'event' ? `4px solid ${apt.color}` : '1px solid #f1f5f9'
                                    }}
                                    onClick={() => setSelectedAppointment(apt)}
                                >
                                    {/* Avatar / Icon */}
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '50%',
                                        background: apt.type === 'event' ? `${apt.color}20` : getDoctorColor(apt.doctorId),
                                        color: apt.type === 'event' ? apt.color : 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '18px', fontWeight: 'bold', marginRight: '24px'
                                    }}>
                                        {apt.type === 'event' ? <Calendar size={20} /> : apt.patient ? apt.patient.charAt(0) : '?'}
                                    </div>

                                    {/* Content */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '16px' }}>
                                            {apt.type === 'event' ? apt.title : apt.patient}
                                        </div>
                                        <div style={{ color: '#64748b', fontSize: '14px' }}>
                                            {apt.type === 'event' ? 'Evento Programado' : apt.treatment}
                                        </div>
                                    </div>

                                    {/* Meta */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f766e', background: '#f0fdfa', padding: '6px 12px', borderRadius: '20px' }}>
                                            <Clock size={16} />
                                            <span style={{ fontWeight: '600', fontSize: '14px' }}>{apt.startTime}</span>
                                        </div>

                                        <div style={{ fontSize: '14px', color: '#475569' }}>
                                            {doctorsData.find(d => d.id === apt.doctorId)?.name || 'Doctor'}
                                        </div>

                                        {apt.type !== 'event' && (
                                            <div style={{
                                                padding: '6px 12px', borderRadius: '20px',
                                                background: getStatusConfig(apt.status).bgColor,
                                                color: getStatusConfig(apt.status).color,
                                                fontSize: '11px', fontWeight: '700',
                                                textTransform: 'uppercase', letterSpacing: '0.5px',
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                border: `1px solid ${getStatusConfig(apt.status).color}40`
                                            }}>
                                                {getStatusConfig(apt.status).icon}
                                                {getStatusConfig(apt.status).label}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                </div>
            ) : (
                /* WEEK VIEW (Detailed Grid with 30min slots) */
                <div style={{ display: 'flex', flex: 1, overflow: 'auto' }}>
                    {/* Time Column */}
                    <div style={{ width: '60px', borderRight: '1px solid #e2e8f0', background: 'white', position: 'sticky', left: 0, zIndex: 20 }}>
                        <div style={{ height: '40px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}></div>
                        {Array.from({ length: 14 }, (_, i) => i + 7).map(h => (
                            <div key={h} style={{ height: '60px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'start', justifyContent: 'center', fontSize: '11px', color: '#94a3b8', paddingTop: '4px' }}>
                                {h}:00
                            </div>
                        ))}
                    </div>

                    {/* Day Columns */}
                    <div style={{ display: 'flex', flex: 1, minWidth: '800px' }}>
                        {weekDates.map((date, i) => (
                            <div key={i} style={{ flex: 1, borderRight: '1px solid #f1f5f9', position: 'relative', minWidth: '120px' }}>
                                {/* Day Header */}
                                <div style={{ height: '40px', padding: '8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
                                    <span style={{ fontSize: '11px', color: '#64748b', marginRight: '4px' }}>
                                        {date.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase()}
                                    </span>
                                    <span style={{ fontWeight: '700', color: isToday(date) ? '#0f766e' : '#1e293b' }}>
                                        {date.getDate()}
                                    </span>
                                </div>

                                {/* Hour Slots (Split into 2x 30min click areas) */}
                                {Array.from({ length: 14 }, (_, h) => h + 7).map(hour => (
                                    <div key={hour} style={{ height: '60px', borderBottom: '1px solid #f1f5f9', position: 'relative' }}>
                                        {/* 00-30 min slot */}
                                        <div
                                            style={{ height: '30px', borderBottom: '1px dashed #f1f5f9', cursor: 'pointer' }}
                                            className="hover:bg-slate-50"
                                            onClick={() => {
                                                handleOpenNewAppointment({
                                                    date: date.toISOString().split('T')[0],
                                                    startTime: `${hour.toString().padStart(2, '0')}:00`,
                                                    endTime: `${hour.toString().padStart(2, '0')}:30`
                                                });
                                            }}
                                        />
                                        {/* 30-60 min slot (SHADED) */}
                                        <div
                                            style={{ height: '30px', cursor: 'pointer', backgroundColor: '#f8fafc' }}
                                            className="hover:bg-slate-100"
                                            onClick={() => {
                                                handleOpenNewAppointment({
                                                    date: date.toISOString().split('T')[0],
                                                    startTime: `${hour.toString().padStart(2, '0')}:30`,
                                                    endTime: `${(hour + 1).toString().padStart(2, '0')}:00`
                                                });
                                            }}
                                        />
                                    </div>
                                ))}

                                {/* Appointments Overlap (Dynamic Layout) */}
                                {getAppointmentsForDate(date).map(apt => {
                                    const [h, m] = apt.startTime.split(':').map(Number);
                                    const top = ((h - 7) * 60) + m + 40;
                                    const height = apt.duration;

                                    // Use pre-calculated cascading layout
                                    const width = apt.layoutWidth || (96 / (apt.colSpan || 1));
                                    const left = apt.layoutLeft || 0;
                                    const baseZ = 10 + (apt.colIndex || 0);
                                    const isCascading = (apt.colSpan || 1) > 3;

                                    return (
                                        <div key={apt.id}
                                            style={{
                                                position: 'absolute',
                                                top: `${top}px`,
                                                left: `${left}%`,
                                                width: `${width}%`,
                                                height: `${height}px`,
                                                backgroundColor: `${getDoctorColor(apt.doctorId)}25`,
                                                borderLeft: `4px solid ${getDoctorColor(apt.doctorId)}`,
                                                borderRadius: '4px',
                                                padding: '4px',
                                                fontSize: '11px',
                                                cursor: 'pointer',
                                                zIndex: baseZ,
                                                overflow: 'hidden',
                                                boxShadow: isCascading ? '1px 1px 4px rgba(0,0,0,0.12)' : '0 1px 2px rgba(0,0,0,0.05)',
                                                color: '#1e293b',
                                                transition: 'z-index 0s, box-shadow 0.15s, transform 0.15s'
                                            }}
                                            onClick={(e) => { e.stopPropagation(); setSelectedAppointment(apt); }}
                                            onMouseEnter={(e) => {
                                                // Apply hover status to ALL appointments for better affordance
                                                e.currentTarget.style.zIndex = '100';
                                                e.currentTarget.style.boxShadow = '2px 4px 12px rgba(0,0,0,0.2)';
                                                e.currentTarget.style.transform = 'scale(1.02)';
                                            }}
                                            onMouseLeave={(e) => {
                                                // Restore original state
                                                e.currentTarget.style.zIndex = String(baseZ);
                                                e.currentTarget.style.boxShadow = isCascading ? '1px 1px 4px rgba(0,0,0,0.12)' : '0 1px 2px rgba(0,0,0,0.05)';
                                                e.currentTarget.style.transform = 'scale(1)';
                                            }}
                                        >
                                            {/* 1. Patient Name (Top Priority) */}
                                            <div style={{ fontWeight: '600', lineHeight: '1.2', marginBottom: '2px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {apt.type === 'event' ? apt.title : apt.patient}
                                            </div>

                                            {/* 2. Time/Treatment (Visible if height permits) */}
                                            {height > 35 && (
                                                <div style={{ fontSize: '10px', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '16px' }}>
                                                    {apt.startTime} - {apt.type === 'event' ? 'Evento' : apt.treatment}
                                                </div>
                                            )}

                                            {/* 3. Status Icon (Bottom Right Corner) */}
                                            {apt.type === 'appointment' && (
                                                <div style={{ position: 'absolute', bottom: '2px', right: '4px', fontSize: '11px' }}>
                                                    {getStatusConfig(apt.status).icon}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* New Appointment Button for Day View (Floating) */}
            {viewMode === 'day' && (
                <button
                    onClick={handleOpenNewAppointment}
                    style={styles.floatingBtn}
                >
                    <Plus size={24} />
                </button>
            )}

            {/* DETAILS MODAL */}
            {selectedAppointment && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 102 }}>
                    <div style={{ background: 'white', borderRadius: '16px', width: '750px', maxWidth: '92vw', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                        {/* Header */}
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>Detalles de la Cita</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <button
                                    onClick={handleEdit}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '6px 12px',
                                        background: '#f0fdfa',
                                        border: '1px solid #ccfbf1',
                                        borderRadius: '6px',
                                        color: '#0d9488',
                                        fontWeight: '600',
                                        fontSize: '13px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = '#e6fffa'}
                                    onMouseOut={(e) => e.currentTarget.style.background = '#f0fdfa'}
                                >
                                    ✎ Editar
                                </button>
                                <button
                                    onClick={() => setSelectedAppointment(null)}
                                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', padding: '4px', display: 'flex' }}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div style={{ padding: '24px' }}>
                            {selectedAppointment.type === 'event' ? (
                                /* EVENT DETAILS */
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{
                                            width: '56px', height: '56px', borderRadius: '12px',
                                            background: selectedAppointment.color, color: 'white',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Calendar size={24} />
                                        </div>
                                        <div>
                                            <h2 style={{ margin: 0, fontSize: '20px', color: '#1e293b' }}>{selectedAppointment.title}</h2>
                                            <span style={{ fontSize: '12px', color: '#64748b' }}>Evento Programado</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Fecha</label>
                                            <div style={{ color: '#334155', fontWeight: '500' }}>{selectedAppointment.date}</div>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Horario</label>
                                            <div style={{ color: '#334155', fontWeight: '500' }}>{selectedAppointment.startTime} - {calculateEndTime(selectedAppointment.startTime, selectedAppointment.duration)}</div>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Doctor</label>
                                            <div style={{ color: '#334155', fontWeight: '500' }}>{doctorsData.find(d => d.id === selectedAppointment.doctorId)?.name || 'Todos'}</div>
                                        </div>
                                    </div>
                                    {selectedAppointment.notes && (
                                        <div style={{ paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Notas</label>
                                            <div style={{ fontSize: '14px', color: '#64748b', background: '#f8fafc', padding: '12px', borderRadius: '8px', lineHeight: '1.5' }}>
                                                {selectedAppointment.notes}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* APPOINTMENT DETAILS */
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                                        <div style={{
                                            width: '64px', height: '64px', borderRadius: '50%',
                                            background: getDoctorColor(selectedAppointment.doctorId), color: 'white',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '24px', fontWeight: 'bold'
                                        }}>
                                            {selectedAppointment.patient ? selectedAppointment.patient.charAt(0) : '?'}
                                        </div>
                                        <div>
                                            <h2 style={{ margin: 0, fontSize: '20px', color: '#1e293b' }}>{selectedAppointment.patient}</h2>
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                                                <span style={{ fontSize: '12px', background: '#f1f5f9', color: '#64748b', padding: '4px 8px', borderRadius: '6px' }}>Paciente</span>
                                                <span style={{
                                                    fontSize: '12px',
                                                    background: getStatusConfig(selectedAppointment.status).bgColor,
                                                    color: getStatusConfig(selectedAppointment.status).color,
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    fontWeight: '600',
                                                    textTransform: 'uppercase',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}>
                                                    <span>{getStatusConfig(selectedAppointment.status).icon}</span>
                                                    {getStatusConfig(selectedAppointment.status).label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                        <div>
                                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Tratamiento</label>
                                            <div style={{ fontSize: '15px', fontWeight: '500', color: '#334155' }}>{selectedAppointment.treatment}</div>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Doctor</label>
                                            <div style={{ fontSize: '15px', fontWeight: '500', color: '#334155' }}>
                                                {doctorsData.find(d => d.id === selectedAppointment.doctorId)?.name}
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Fecha</label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', color: '#334155' }}>
                                                <Calendar size={16} color="#64748b" />
                                                {new Date(selectedAppointment.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Horario</label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', color: '#334155' }}>
                                                <Clock size={16} color="#64748b" />
                                                {selectedAppointment.startTime} - {calculateEndTime(selectedAppointment.startTime, selectedAppointment.duration)}
                                            </div>
                                        </div>
                                    </div>
                                    {selectedAppointment.notes && (
                                        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Notas</label>
                                            <div style={{ fontSize: '14px', color: '#64748b', background: '#f8fafc', padding: '12px', borderRadius: '8px', lineHeight: '1.5' }}>
                                                {selectedAppointment.notes}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        {/* Footer - Only show for appointments (status actions) */}
                        {selectedAppointment.type === 'appointment' && (
                            <div style={{ padding: '20px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                                {/* Status Action Buttons - Full Width */}
                                <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                                    <button
                                        onClick={() => handleStatusChange(selectedAppointment.id, 'confirmed')}
                                        disabled={selectedAppointment.status === 'confirmed'}
                                        style={{
                                            flex: '1',
                                            padding: '12px 20px',
                                            background: selectedAppointment.status === 'confirmed' ? '#d1fae5' : 'white',
                                            border: `2px solid ${APPOINTMENT_STATUS.confirmed.color}`,
                                            borderRadius: '8px',
                                            color: APPOINTMENT_STATUS.confirmed.color,
                                            fontWeight: '600',
                                            cursor: selectedAppointment.status === 'confirmed' ? 'not-allowed' : 'pointer',
                                            opacity: selectedAppointment.status === 'confirmed' ? 0.6 : 1,
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            fontSize: '14px'
                                        }}
                                        onMouseOver={(e) => {
                                            if (selectedAppointment.status !== 'confirmed') {
                                                e.currentTarget.style.background = APPOINTMENT_STATUS.confirmed.bgColor;
                                            }
                                        }}
                                        onMouseOut={(e) => {
                                            if (selectedAppointment.status !== 'confirmed') {
                                                e.currentTarget.style.background = 'white';
                                            }
                                        }}
                                    >
                                        <span>{APPOINTMENT_STATUS.confirmed.icon}</span>
                                        Confirmar
                                    </button>

                                    <button
                                        onClick={() => handleStatusChange(selectedAppointment.id, 'attended')}
                                        disabled={selectedAppointment.status === 'attended'}
                                        style={{
                                            flex: '1',
                                            padding: '12px 20px',
                                            background: selectedAppointment.status === 'attended' ? '#dbeafe' : 'white',
                                            border: `2px solid ${APPOINTMENT_STATUS.attended.color}`,
                                            borderRadius: '8px',
                                            color: APPOINTMENT_STATUS.attended.color,
                                            fontWeight: '600',
                                            cursor: selectedAppointment.status === 'attended' ? 'not-allowed' : 'pointer',
                                            opacity: selectedAppointment.status === 'attended' ? 0.6 : 1,
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            fontSize: '14px'
                                        }}
                                        onMouseOver={(e) => {
                                            if (selectedAppointment.status !== 'attended') {
                                                e.currentTarget.style.background = APPOINTMENT_STATUS.attended.bgColor;
                                            }
                                        }}
                                        onMouseOut={(e) => {
                                            if (selectedAppointment.status !== 'attended') {
                                                e.currentTarget.style.background = 'white';
                                            }
                                        }}
                                    >
                                        <span>{APPOINTMENT_STATUS.attended.icon}</span>
                                        Atendido
                                    </button>

                                    <button
                                        onClick={() => handleStatusChange(selectedAppointment.id, 'cancelled')}
                                        disabled={selectedAppointment.status === 'cancelled'}
                                        style={{
                                            flex: '1',
                                            padding: '12px 20px',
                                            background: selectedAppointment.status === 'cancelled' ? '#fee2e2' : 'white',
                                            border: `2px solid ${APPOINTMENT_STATUS.cancelled.color}`,
                                            borderRadius: '8px',
                                            color: APPOINTMENT_STATUS.cancelled.color,
                                            fontWeight: '600',
                                            cursor: selectedAppointment.status === 'cancelled' ? 'not-allowed' : 'pointer',
                                            opacity: selectedAppointment.status === 'cancelled' ? 0.6 : 1,
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            fontSize: '14px'
                                        }}
                                        onMouseOver={(e) => {
                                            if (selectedAppointment.status !== 'cancelled') {
                                                e.currentTarget.style.background = APPOINTMENT_STATUS.cancelled.bgColor;
                                            }
                                        }}
                                        onMouseOut={(e) => {
                                            if (selectedAppointment.status !== 'cancelled') {
                                                e.currentTarget.style.background = 'white';
                                            }
                                        }}
                                    >
                                        <span>{APPOINTMENT_STATUS.cancelled.icon}</span>
                                        Cancelar Cita
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )
            }

            {/* --- NEW APPOINTMENT / EVENT MODAL --- */}
            {
                showModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 101 }}>
                        <div style={{ background: 'white', borderRadius: '16px', width: '1100px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>

                            {/* Header Tabs */}
                            <div style={{ padding: '24px 32px 0 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                                    {(activeTab === 'cita' && newAppointment.id) ? (
                                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f766e', margin: 0 }}>Editar Cita</h2>
                                    ) : (activeTab === 'evento' && newEvent.id) ? (
                                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f766e', margin: 0 }}>Editar Evento</h2>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => setActiveTab('cita')}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    borderBottom: activeTab === 'cita' ? '3px solid #14b8a6' : '3px solid transparent',
                                                    paddingBottom: '12px',
                                                    fontSize: '16px',
                                                    fontWeight: '600',
                                                    color: activeTab === 'cita' ? '#0f172a' : '#64748b',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                Crear una cita
                                            </button>
                                            <button
                                                onClick={() => setActiveTab('evento')}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    borderBottom: activeTab === 'evento' ? '3px solid #14b8a6' : '3px solid transparent',
                                                    paddingBottom: '12px',
                                                    fontSize: '16px',
                                                    fontWeight: '600',
                                                    color: activeTab === 'evento' ? '#0f172a' : '#64748b',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                Crear un evento
                                            </button>
                                        </>
                                    )}
                                </div>
                                <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}>✕</button>
                            </div>

                            {/* Content */}
                            <div style={{ padding: '32px' }}>
                                {activeTab === 'cita' ? (
                                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: '40px' }}>

                                        {/* Column 1: Patient & Medical Info */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                            {/* Patient */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: '14px', color: '#64748b' }}>Paciente</label>
                                                {!createNewPatient ? (
                                                    <>
                                                        <div style={{ position: 'relative' }}>
                                                            <input
                                                                placeholder="Buscar paciente..."
                                                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#334155' }}
                                                                value={patientSearchTerm}
                                                                onChange={(e) => {
                                                                    setPatientSearchTerm(e.target.value);
                                                                    setShowPatientSuggestions(true);
                                                                    setNewAppointment({ ...newAppointment, patientId: '' }); // Reset ID on type
                                                                }}
                                                                onFocus={() => setShowPatientSuggestions(true)}
                                                            />
                                                            <Search size={16} color="#94a3b8" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />

                                                            {showPatientSuggestions && patientSearchTerm && (
                                                                <div style={{
                                                                    position: 'absolute', top: '100%', left: 0, right: 0,
                                                                    background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
                                                                    maxHeight: '200px', overflowY: 'auto', zIndex: 50, marginTop: '4px',
                                                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                                                                }}>
                                                                    {patientsData
                                                                        .filter(p => `${p.first_name} ${p.last_name}`.toLowerCase().includes(patientSearchTerm.toLowerCase()))
                                                                        .map(p => (
                                                                            <div
                                                                                key={p.id}
                                                                                onClick={() => {
                                                                                    setNewAppointment({ ...newAppointment, patientId: p.id });
                                                                                    setPatientSearchTerm(`${p.first_name} ${p.last_name}`);
                                                                                    setShowPatientSuggestions(false);
                                                                                }}
                                                                                style={{
                                                                                    padding: '10px 14px',
                                                                                    cursor: 'pointer',
                                                                                    borderBottom: '1px solid #f1f5f9',
                                                                                    fontSize: '14px',
                                                                                    color: '#334155'
                                                                                }}
                                                                                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                                                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                                                            >
                                                                                {p.first_name} {p.last_name}
                                                                            </div>
                                                                        ))}
                                                                    {patientsData.filter(p => `${p.first_name} ${p.last_name}`.toLowerCase().includes(patientSearchTerm.toLowerCase())).length === 0 && (
                                                                        <div style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '13px' }}>No se encontraron pacientes</div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#14b8a6', cursor: 'pointer', width: 'fit-content' }}>
                                                            <input type="checkbox" checked={createNewPatient} onChange={() => setCreateNewPatient(true)} style={{ accentColor: '#14b8a6' }} />
                                                            Crear nuevo paciente
                                                        </label>
                                                    </>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>NUEVO PACIENTE</span>
                                                            <button type="button" onClick={() => setCreateNewPatient(false)} style={{ border: 'none', background: 'transparent', color: '#ef4444', fontSize: '12px', cursor: 'pointer' }}>Cancelar</button>
                                                        </div>

                                                        {/* DNI Lookup Field */}
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <input
                                                                placeholder="DNI (8 dígitos)"
                                                                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                                                value={newAppointment.newPatientDni}
                                                                onChange={e => setNewAppointment({ ...newAppointment, newPatientDni: e.target.value })}
                                                                maxLength={8}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={handleDniSearch}
                                                                disabled={isDniLoading}
                                                                style={{
                                                                    padding: '8px 12px', borderRadius: '6px', border: 'none',
                                                                    background: '#14b8a6', color: 'white', cursor: isDniLoading ? 'wait' : 'pointer',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                                }}
                                                            >
                                                                {isDniLoading ? '...' : <Search size={16} />}
                                                            </button>
                                                        </div>

                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                            <div>
                                                                <input
                                                                    placeholder="Nombre *"
                                                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                                                    value={newAppointment.newPatientName}
                                                                    onChange={e => setNewAppointment({ ...newAppointment, newPatientName: e.target.value })}
                                                                    onBlur={e => setNewAppointment({ ...newAppointment, newPatientName: toTitleCase(e.target.value) })}
                                                                />
                                                            </div>
                                                            <div>
                                                                <input
                                                                    placeholder="Apellidos *"
                                                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                                                    value={newAppointment.newPatientLastName}
                                                                    onChange={e => setNewAppointment({ ...newAppointment, newPatientLastName: e.target.value })}
                                                                    onBlur={e => setNewAppointment({ ...newAppointment, newPatientLastName: toTitleCase(e.target.value) })}
                                                                />
                                                            </div>
                                                        </div>
                                                        <input
                                                            placeholder="Teléfono *"
                                                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                                            value={newAppointment.newPatientPhone}
                                                            onChange={e => setNewAppointment({ ...newAppointment, newPatientPhone: e.target.value })}
                                                        />
                                                        <input
                                                            placeholder="Dirección (Opcional)"
                                                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                                            value={newAppointment.newPatientAddress}
                                                            onChange={e => setNewAppointment({ ...newAppointment, newPatientAddress: e.target.value })}
                                                        />
                                                        <input
                                                            placeholder="Correo electrónico (Opcional)"
                                                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                                            value={newAppointment.newPatientEmail}
                                                            onChange={e => setNewAppointment({ ...newAppointment, newPatientEmail: e.target.value })}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Doctor */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: '14px', color: '#64748b' }}>Doctor</label>
                                                <select
                                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#334155' }}
                                                    value={newAppointment.doctorId}
                                                    onChange={e => setNewAppointment({ ...newAppointment, doctorId: e.target.value })}
                                                >
                                                    <option value="">Seleccionar</option>
                                                    {doctorsData.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                                </select>
                                            </div>

                                            {/* Especialidad (Read only based on doctor) */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: '14px', color: '#64748b' }}>Especialidad</label>
                                                <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                                                    {doctorsData.find(d => d.id == newAppointment.doctorId)?.specialty || '--'}
                                                </div>
                                            </div>

                                            {/* Motivo */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: '14px', color: '#64748b' }}>Motivo</label>
                                                <div style={{ position: 'relative' }}>
                                                    <input
                                                        placeholder="Buscar motivo"
                                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
                                                        value={newAppointment.motivo}
                                                        onChange={e => setNewAppointment({ ...newAppointment, motivo: e.target.value })}
                                                    />
                                                    <Search size={16} color="#94a3b8" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                                                </div>
                                            </div>

                                            {/* Services */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: '14px', color: '#64748b' }}>Agregar servicio <span style={{ fontSize: '12px' }}>(Opcional)</span></label>
                                                <ServiceSelector
                                                    value={newAppointment.serviceId}
                                                    onChange={(service) => {
                                                        if (service) {
                                                            setNewAppointment(prev => ({
                                                                ...prev,
                                                                serviceId: service.id,
                                                                // Optional: Auto-fill reason if empty
                                                                motivo: prev.motivo || service.name
                                                            }));
                                                        } else {
                                                            setNewAppointment(prev => ({ ...prev, serviceId: '' }));
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Column 2: Date & Logistics */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                            {/* Date */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: '14px', color: '#64748b' }}>Fecha</label>
                                                <div style={{ position: 'relative' }}>
                                                    <input
                                                        type="date"
                                                        min={new Date().toISOString().split('T')[0]}
                                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#334155', boxSizing: 'border-box' }}
                                                        value={newAppointment.date}
                                                        onChange={e => setNewAppointment({ ...newAppointment, date: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            {/* Time Range */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: '14px', color: '#64748b' }}>Hora</label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <TimeCombobox
                                                            value={newAppointment.startTime}
                                                            onChange={(val) => setNewAppointment(prev => ({ ...prev, startTime: val, endTime: calculateEndTime(val, 30) }))}
                                                        />
                                                    </div>
                                                    <span style={{ color: '#94a3b8' }}>–</span>
                                                    <div style={{ flex: 1 }}>
                                                        <TimeCombobox
                                                            value={newAppointment.endTime}
                                                            onChange={(val) => setNewAppointment(prev => ({ ...prev, endTime: val }))}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Opcional Header */}
                                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#94a3b8', marginTop: '12px' }}>Opcional</div>

                                            {/* Consultorio */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: '14px', color: '#64748b' }}>Consultorio ⓘ</label>
                                                <select style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#334155' }}>
                                                    <option>Consultorio 1</option>
                                                    <option>Consultorio 2</option>
                                                </select>
                                            </div>



                                            {/* Nota */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: '14px', color: '#64748b' }}>Nota de la cita</label>
                                                <textarea
                                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '80px', resize: 'vertical', boxSizing: 'border-box' }}
                                                    value={newAppointment.notes}
                                                    onChange={e => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                                                />
                                            </div>

                                        </div>

                                        {/* Footer Actions */}
                                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                                            {newAppointment.id && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteAppointment(newAppointment.id)}
                                                    style={{ marginRight: 'auto', padding: '10px 16px', borderRadius: '8px', border: '1px solid #fee2e2', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}
                                                >
                                                    <Trash2 size={18} />
                                                    Eliminar
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setShowModal(false)}
                                                style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#14b8a6', color: 'white', fontWeight: '600', cursor: 'pointer' }}
                                            >
                                                Guardar
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    /* EVENT FORM */
                                    <form onSubmit={handleEventSubmit} style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>
                                            Este evento restringirá la disponibilidad del doctor seleccionado en este horario.
                                        </p>

                                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '16px' }}>
                                            <label style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', textAlign: 'right' }}>Doctor</label>
                                            <select
                                                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', width: '100%' }}
                                                value={newEvent.doctorId}
                                                onChange={(e) => setNewEvent({ ...newEvent, doctorId: e.target.value })}
                                            >
                                                <option value="">Seleccionar</option>
                                                {doctorsData.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                            </select>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '16px' }}>
                                            <label style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', textAlign: 'right' }}>Nombre</label>
                                            <input
                                                placeholder="Congreso, curso, etc"
                                                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', width: '100%' }}
                                                value={newEvent.title}
                                                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                                required
                                            />
                                        </div>



                                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '16px' }}>
                                            <div></div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={newEvent.allDay}
                                                    onChange={(e) => setNewEvent({ ...newEvent, allDay: e.target.checked })}
                                                    id="allDayCheck"
                                                    style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                                                />
                                                <label htmlFor="allDayCheck" style={{ fontSize: '14px', color: '#0f766e', cursor: 'pointer' }}>Bloquear todo el día</label>
                                            </div>
                                        </div>

                                        {!newEvent.allDay && (
                                            <>
                                                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '16px' }}>
                                                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', textAlign: 'right' }}>Hora inicio</label>
                                                    <div style={{ width: '100%' }}>
                                                        <TimeCombobox value={newEvent.startTime} onChange={(t) => setNewEvent({ ...newEvent, startTime: t })} />
                                                    </div>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '16px' }}>
                                                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', textAlign: 'right' }}>Hora final</label>
                                                    <div style={{ width: '100%' }}>
                                                        <TimeCombobox value={newEvent.endTime} onChange={(t) => setNewEvent({ ...newEvent, endTime: t })} />
                                                    </div>
                                                </div>
                                            </>
                                        )}



                                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'start', gap: '16px' }}>
                                            <label style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', textAlign: 'right', marginTop: '10px' }}>Nota adicional</label>
                                            <textarea
                                                rows={3}
                                                placeholder="Deja una nota..."
                                                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', width: '100%', resize: 'none' }}
                                                value={newEvent.notes}
                                                onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', gap: '12px' }}>
                                            {newEvent.id && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteEvent(newEvent.id)}
                                                    style={{ marginRight: 'auto', padding: '10px 16px', borderRadius: '8px', border: '1px solid #fee2e2', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}
                                                >
                                                    <Trash2 size={18} />
                                                    Eliminar
                                                </button>
                                            )}
                                            <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>Cancelar</button>
                                            <button type="submit" style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#14b8a6', color: 'white', fontWeight: '600', cursor: 'pointer' }}>
                                                {newEvent.id ? 'Guardar' : 'Crear evento'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
            {/* CUSTOM ALERT MODAL */}
            {
                alertState.isOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                                {alertState.type === 'confirm' ? (
                                    <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '50%', color: '#ef4444' }}>
                                        <AlertTriangle size={32} />
                                    </div>
                                ) : (
                                    <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '50%', color: '#3b82f6' }}>
                                        <Info size={32} />
                                    </div>
                                )}
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#1e293b' }}>{alertState.title}</h3>
                            <p style={{ color: '#64748b', marginBottom: '24px', lineHeight: '1.5' }}>{alertState.message}</p>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                {alertState.type === 'confirm' && (
                                    <button
                                        onClick={() => setAlertState({ ...alertState, isOpen: false })}
                                        style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
                                    >
                                        Cancelar
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        if (alertState.onConfirm) alertState.onConfirm();
                                        setAlertState({ ...alertState, isOpen: false });
                                    }}
                                    style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: alertState.type === 'confirm' ? '#ef4444' : '#3b82f6', color: 'white', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    {alertState.type === 'confirm' ? 'Eliminar' : 'Aceptar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default AppointmentsPage;
