const dotenv = require('dotenv');
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.VITE_GOOGLE_CLIENT_SECRET;

const isDryRun = process.argv.includes('--dry-run');

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Falta VITE_SUPABASE_URL o VITE_SUPABASE_SERVICE_ROLE_KEY en .env");
    process.exit(1);
}

// Simple fetch wrapper for Supabase REST API to avoid CJS module issues with @supabase/supabase-js
async function supabaseQuery(table, queryParams = "") {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${queryParams}`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
        }
    });
    return res.json();
}

async function supabaseUpdate(table, id, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Supabase Update failed: ${await res.text()}`);
    return res.json();
}

async function getValidGoogleToken() {
    console.log("Obteniendo token de integración de Google Calendar...");
    const integs = await supabaseQuery('integrations', 'provider=eq.google_calendar&select=*');
    console.log("Response from DB:", integs);
    if (!integs || !Array.isArray(integs) || integs.length === 0) throw new Error("No hay integración con Google Calendar en la base de datos.");
    
    const integ = integs[0];
    if (integ.status !== 'connected' || !integ.refresh_token) {
        throw new Error("La integración de Google Calendar no está conectada o falta el refresh token.");
    }

    const payload = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: integ.refresh_token,
        grant_type: 'refresh_token',
    });

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload.toString()
    });

    if (!res.ok) throw new Error(`Failed to refresh Google token: ${await res.text()}`);
    const data = await res.json();
    return data.access_token;
}

async function fetchGoogleAPI(path, token, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
    if (body) options.body = JSON.stringify(body);
    
    const res = await fetch(`https://www.googleapis.com/calendar/v3${path}`, options);
    if (!res.ok && res.status !== 404 && res.status !== 410) {
        throw new Error(`Google API Error (${method} ${path}): ${await res.text()}`);
    }
    return res.status === 204 ? null : res.json();
}

function removeAccents(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function mergeCalendars() {
    if (isDryRun) {
        console.log("==========================================");
        console.log("   MODO DRY-RUN ACTIVADO (Sin Cambios)    ");
        console.log("==========================================\n");
    }

    try {
        const token = await getValidGoogleToken();
        console.log("Token obtenido exitosamente.\n");

        console.log("1. Obteniendo Doctores...");
        const doctors = await supabaseQuery('doctors', 'select=*');
        console.log(`Encontrados ${doctors.length} doctores.\n`);

        console.log("2. Listando calendarios de Google...");
        const listData = await fetchGoogleAPI('/users/me/calendarList', token);
        const calendars = listData.items || [];
        console.log(`Encontrados ${calendars.length} calendarios en la cuenta.\n`);

        for (const doc of doctors) {
            if (doc.specialty === 'ADMINISTRACION') continue;
            
            const cleanName = removeAccents(doc.name).toLowerCase();
            const parts = cleanName.split(' ');
            const firstName = parts[0];
            const lastName = parts.length > 1 ? parts[1] : '';

            // Find all calendars that might belong to this doctor
            const docCalendars = calendars.filter(c => {
                const cleanSummary = removeAccents(c.summary).toLowerCase();
                // Must contain both first name and last name
                return cleanSummary.includes(firstName) && cleanSummary.includes(lastName);
            });

            if (docCalendars.length > 1) {
                console.log(`==========================================`);
                console.log(`DUPLICADO DETECTADO: ${doc.name}`);
                
                // Identify Official (- CURAE) vs Old
                let officialCal = docCalendars.find(c => c.summary.toLowerCase().includes('curae'));
                let oldCals = docCalendars.filter(c => c.id !== officialCal?.id);

                if (!officialCal && oldCals.length > 0) {
                    // No official calendar yet, use the first old one as official and rename it
                    officialCal = oldCals.shift();
                    console.log(`- No hay calendario oficial. Se usará '${officialCal.summary}' como oficial y se renombrará a '${doc.name} - CURAE'`);
                    if (!isDryRun) {
                        await fetchGoogleAPI(`/calendars/${encodeURIComponent(officialCal.id)}`, token, 'PATCH', { summary: `${doc.name} - CURAE` });
                    }
                } else if (officialCal) {
                    console.log(`- Calendario Oficial: '${officialCal.summary}' (${officialCal.id})`);
                }

                if (oldCals.length > 0) {
                    console.log(`- Calendarios a eliminar: ${oldCals.map(c => `'${c.summary}'`).join(', ')}`);
                }

                for (const oldCal of oldCals) {
                    // Get all events from old calendar
                    console.log(`  -> Obteniendo eventos de '${oldCal.summary}'...`);
                    const eventsData = await fetchGoogleAPI(`/calendars/${encodeURIComponent(oldCal.id)}/events?maxResults=2500`, token);
                    const events = eventsData.items || [];
                    console.log(`     Se encontraron ${events.length} eventos.`);

                    if (isDryRun) {
                        console.log(`     [DRY-RUN] Se moverían ${events.length} eventos a '${officialCal.summary}'`);
                        console.log(`     [DRY-RUN] Luego se eliminaría el calendario '${oldCal.summary}'`);
                    } else {
                        let movedCount = 0;
                        for (const evt of events) {
                            if (evt.status === 'cancelled') continue;
                            
                            // Insert into official calendar
                            const payload = {
                                summary: evt.summary,
                                description: evt.description,
                                start: evt.start,
                                end: evt.end,
                                colorId: evt.colorId
                            };
                            try {
                                await fetchGoogleAPI(`/calendars/${encodeURIComponent(officialCal.id)}/events`, token, 'POST', payload);
                                movedCount++;
                                await sleep(100); // Prevent rate limits
                            } catch(e) {
                                console.error(`     Error moviendo evento '${evt.summary}':`, e.message);
                            }
                        }
                        console.log(`     [REAL] ${movedCount} eventos movidos exitosamente.`);

                        // Delete old calendar
                        console.log(`     [REAL] Eliminando calendario '${oldCal.summary}'...`);
                        await fetchGoogleAPI(`/calendars/${encodeURIComponent(oldCal.id)}`, token, 'DELETE');
                        console.log(`     [REAL] Calendario eliminado.`);
                    }
                }

                if (!isDryRun) {
                    // Update Supabase to point to official calendar
                    if (doc.google_calendar_id !== officialCal.id) {
                        console.log(`  -> Actualizando google_calendar_id en base de datos para ${doc.name}...`);
                        await supabaseUpdate('doctors', doc.id, { google_calendar_id: officialCal.id });
                    }
                }
            } else if (docCalendars.length === 1 && docCalendars[0].id !== doc.google_calendar_id) {
                 // Supabase ID is out of sync but there's only 1 calendar
                 console.log(`==========================================`);
                 console.log(`DESINCRONIZADO: ${doc.name}`);
                 console.log(`- ID guardado no coincide con el único calendario encontrado ('${docCalendars[0].summary}').`);
                 if (isDryRun) {
                     console.log(`  [DRY-RUN] Se actualizaría el ID en la base de datos.`);
                 } else {
                     await supabaseUpdate('doctors', doc.id, { google_calendar_id: docCalendars[0].id });
                     console.log(`  [REAL] ID actualizado en la base de datos.`);
                 }
            }
        }

        console.log("\n==========================================");
        console.log("               PROCESO TERMINADO          ");
        console.log("==========================================");

    } catch (err) {
        console.error("Error durante el proceso:", err);
    }
}

mergeCalendars();
