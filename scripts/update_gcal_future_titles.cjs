/**
 * update_gcal_future_titles.cjs
 *
 * Limpia TODOS los eventos futuros de Google Calendar que contengan el prefijo
 * "Paciente:" en el título. Esto incluye:
 *   1. Citas ligadas a la BD (via google_calendar_event_id)
 *   2. Eventos huérfanos directamente en Google Calendar
 *
 * Uso: node scripts/update_gcal_future_titles.cjs
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.VITE_GOOGLE_CLIENT_SECRET;

async function getToken() {
    const { data: integ } = await supabase.from('integrations').select('*').eq('provider', 'google_calendar').maybeSingle();
    if (!integ || !integ.refresh_token) throw new Error('No refresh token in integrations table. Reconnect Google Calendar in app.');
    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            refresh_token: integ.refresh_token,
            grant_type: 'refresh_token'
        }).toString()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Token refresh failed');
    return data.access_token;
}

async function patchEvent(token, calendarId, eventId, newSummary) {
    const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
        {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ summary: newSummary })
        }
    );
    return res.ok;
}

async function run() {
    console.log('====================================================');
    console.log(' Limpiador de títulos de Google Calendar - Curae');
    console.log('====================================================\n');

    const token = await getToken();
    const today = new Date().toISOString().split('T')[0];
    let totalUpdated = 0;
    let totalFailed = 0;

    // ── PASO 1: Citas enlazadas en la BD ──────────────────────────────────
    console.log('PASO 1: Corrigiendo citas enlazadas en base de datos...\n');
    const { data: appointments, error } = await supabase
        .from('appointments')
        .select('*, patient:patients(first_name, last_name), doctor:doctors(google_calendar_id, name)')
        .gte('date', today)
        .not('google_calendar_event_id', 'is', null);

    if (error) {
        console.error('Error fetching appointments:', error);
    } else {
        console.log(`Encontradas ${appointments.length} citas futuras con Google Calendar Event ID.\n`);
        for (const apt of appointments) {
            const calendarId = apt.doctor?.google_calendar_id || 'primary';
            const patientName = apt.patient ? `${apt.patient.first_name} ${apt.patient.last_name}`.trim() : 'Sin paciente';
            const newSummary = apt.is_emergency ? `[🚨] ${patientName}` : patientName;

            const ok = await patchEvent(token, calendarId, apt.google_calendar_event_id, newSummary);
            if (ok) {
                console.log(`  [OK] "${newSummary}" — ${apt.date} ${apt.start_time?.slice(0,5)}`);
                totalUpdated++;
            } else {
                console.warn(`  [ERROR] ID ${apt.id}`);
                totalFailed++;
            }
        }
    }

    // ── PASO 2: Eventos huérfanos con "Paciente:" en el título ────────────
    console.log('\nPASO 2: Buscando eventos huérfanos con "Paciente:" en el título...\n');
    const { data: doctors } = await supabase.from('doctors').select('id, name, google_calendar_id').not('google_calendar_id', 'is', null);

    const timeMin = new Date(today).toISOString();
    const timeMax = new Date(new Date(today).setMonth(new Date(today).getMonth() + 3)).toISOString();

    for (const doc of (doctors || [])) {
        const q = new URLSearchParams({ timeMin, timeMax, q: 'Paciente:', singleEvents: 'true', maxResults: 100 });
        const evRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(doc.google_calendar_id)}/events?${q}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!evRes.ok) continue;

        const evData = await evRes.json();
        const orphans = (evData.items || []).filter(ev => ev.summary && ev.summary.includes('Paciente:'));

        if (orphans.length === 0) continue;
        console.log(`  [${doc.name}] ${orphans.length} eventos huérfanos encontrados.`);

        for (const ev of orphans) {
            // Extract patient name: "Paciente: NOMBRE - Doctor(a) ..." → "NOMBRE"
            const match = ev.summary.match(/Paciente:\s*(.+?)(?:\s*-\s*Doctor\(a\).*)?$/i);
            const cleanName = match ? match[1].trim() : ev.summary;
            const ok = await patchEvent(token, doc.google_calendar_id, ev.id, cleanName);
            if (ok) {
                console.log(`    [OK] "${cleanName}" — ${ev.start?.dateTime || ev.start?.date}`);
                totalUpdated++;
            } else {
                console.warn(`    [ERROR] Event ID ${ev.id}`);
                totalFailed++;
            }
        }
    }

    console.log('\n====================================================');
    console.log(` COMPLETADO: ${totalUpdated} corregidos, ${totalFailed} fallidos.`);
    console.log('====================================================');
}

run().catch(err => {
    console.error('Fatal error:', err.message);
    process.exit(1);
});
