const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
    console.log('Iniciando actualización de títulos de eventos futuros en Google Calendar...');
    
    // 1. Obtener integración de Google Calendar para el token
    const { data: integ, error: dbErr } = await supabase
        .from('integrations')
        .select('*')
        .eq('provider', 'google_calendar')
        .maybeSingle();

    if (dbErr || !integ || !integ.access_token) {
        console.error('Error al obtener la integración de Google Calendar:', dbErr || 'No conectado');
        return;
    }

    let accessToken = integ.access_token;
    const now = Date.now();

    // 2. Refrescar token si está por expirar
    if (integ.expiry_date && (now + 5 * 60 * 1000) > integ.expiry_date) {
        console.log('Token de Google expirado o por expirar. Refrescando...');
        if (!integ.refresh_token) {
            console.error('No hay refresh_token guardado. Vuelve a conectar Google Calendar en la app.');
            return;
        }

        const payload = new URLSearchParams({
            client_id: process.env.VITE_GOOGLE_CLIENT_ID,
            client_secret: process.env.VITE_GOOGLE_CLIENT_SECRET,
            refresh_token: integ.refresh_token,
            grant_type: 'refresh_token',
        });

        const res = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: payload.toString()
        });

        const data = await res.json();
        if (!res.ok) {
            console.error('Error al refrescar token de Google:', data);
            return;
        }

        accessToken = data.access_token;
        const newExpiry = Date.now() + (data.expires_in * 1000);

        // Guardar nuevo token en la BD
        await supabase
            .from('integrations')
            .update({
                access_token: accessToken,
                expiry_date: newExpiry,
                updated_at: new Date().toISOString()
            })
            .eq('id', integ.id);

        console.log('Token refrescado y guardado con éxito.');
    }

    // 3. Obtener citas futuras (a partir del 1 de Junio de 2026) que estén sincronizadas con Google Calendar
    const { data: appointments, error: aptErr } = await supabase
        .from('appointments')
        .select('*, patient:patients(first_name, last_name), doctor:doctors(google_calendar_id, name)')
        .gte('date', '2026-06-01')
        .not('google_calendar_event_id', 'is', null);

    if (aptErr) {
        console.error('Error al obtener citas de la base de datos:', aptErr);
        return;
    }

    console.log(`Se encontraron ${appointments.length} citas futuras sincronizadas.`);

    let updatedCount = 0;
    let failedCount = 0;

    for (const apt of appointments) {
        const calendarId = apt.doctor?.google_calendar_id || 'primary';
        const eventId = apt.google_calendar_event_id;
        const patientName = apt.patient ? `${apt.patient.first_name || ''} ${apt.patient.last_name || ''}`.trim() : 'Sin paciente';
        
        // Formato limpio: solo el emoji de emergencia si corresponde, y el nombre directo
        const summaryPrefix = apt.is_emergency ? '[🚨] ' : '';
        const newSummary = `${summaryPrefix}${patientName}`;

        console.log(`[⚙️] Actualizando Cita ID ${apt.id}: "${newSummary}" (Calendario: ${apt.doctor?.name || 'Varios'})`);

        try {
            const patchRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    summary: newSummary
                })
            });

            if (patchRes.ok) {
                console.log(`[✅] Cita ID ${apt.id} actualizada con éxito en Google Calendar.`);
                updatedCount++;
            } else {
                const errData = await patchRes.json();
                console.warn(`[❌] Error al actualizar Cita ID ${apt.id}:`, errData.error?.message || 'Error desconocido');
                failedCount++;
            }
        } catch (fetchErr) {
            console.error(`[❌] Excepción de red al actualizar Cita ID ${apt.id}:`, fetchErr.message);
            failedCount++;
        }
    }

    console.log(`\n¡Proceso completado!`);
    console.log(`Citas actualizadas con éxito: ${updatedCount}`);
    console.log(`Citas fallidas o no encontradas en Google Calendar: ${failedCount}`);
}

run();
