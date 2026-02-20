import { DateTime } from 'luxon';
import { supabase } from '../lib/supabase';

// Helper to exchange Authorization Code for Access and Refresh Tokens
export const exchangeGoogleCodeForTokens = async (authCode) => {
    try {
        const payload = new URLSearchParams({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
            code: authCode,
            grant_type: 'authorization_code',
            redirect_uri: 'postmessage', // @react-oauth/google uses postmessage for auth-code flow
        });

        const res = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: payload.toString()
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error_description || data.error || 'Failed to exchange token');
        }

        // Decode the id_token to get user email if available
        let userEmail = 'Usuario Conectado'; // Default fallback
        if (data.id_token) {
            try {
                // simple base64 decode of JWT payload
                const base64Url = data.id_token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                const decoded = JSON.parse(jsonPayload);
                if (decoded.email) userEmail = decoded.email;
            } catch (e) {
                console.error("Could not parse id_token", e);
            }
        }

        // data contains: access_token, refresh_token, expires_in, scope, token_type
        // Save to LocalStorage for immediate session
        localStorage.setItem('google_access_token', data.access_token);
        localStorage.setItem('google_connected_email', userEmail);
        const expiry = Date.now() + (data.expires_in * 1000);
        localStorage.setItem('google_token_expiry', expiry.toString());

        // Save to Supabase for Offline Access
        const { error: dbError } = await supabase
            .from('integrations')
            .upsert({
                provider: 'google_calendar',
                access_token: data.access_token,
                refresh_token: data.refresh_token, // Make sure to preserve if not returned in subsequent calls
                expiry_date: expiry,
                status: 'connected',
                updated_at: new Date().toISOString()
            }, { onConflict: 'provider' });

        if (dbError) throw dbError;

        return { success: true, tokens: data };

    } catch (err) {
        console.error("Token Exchange Error:", err);
        return { success: false, error: err.message };
    }
};

/**
 * Retrieves a valid Google Access Token globally for the clinic.
 * It checks Supabase. If the token is expired but a refresh_token exists,
 * it will automatically exchange it for a new access_token.
 */
export const getValidGoogleToken = async () => {
    try {
        // 1. Fetch Integration from DB
        const { data: integ } = await supabase
            .from('integrations')
            .select('*')
            .eq('provider', 'google_calendar')
            .maybeSingle();

        if (!integ || integ.status !== 'connected' || !integ.access_token) {
            return null; // Not connected globally
        }

        // 2. Check Expiry
        const now = Date.now();
        // Give a 5-minute buffer before actual expiry to refresh
        if (integ.expiry_date && (now + 5 * 60 * 1000) > integ.expiry_date) {
            console.log("Global Google Token expired/expiring soon. Refreshing via Supabase...");

            if (!integ.refresh_token) {
                console.error("Expired but no refresh_token stored. Must re-authenticate manually.");
                return null;
            }

            // 3. Perform Refresh
            const payload = new URLSearchParams({
                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
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
                console.error("Refresh failed:", data);
                return null;
            }

            const newExpiry = Date.now() + (data.expires_in * 1000);

            // 4. Save new access_token and expiry back to DB
            const { error: updateError } = await supabase
                .from('integrations')
                .update({
                    access_token: data.access_token,
                    // sometimes google doesn't return a new refresh token, keep old one if so
                    refresh_token: data.refresh_token || integ.refresh_token,
                    expiry_date: newExpiry,
                    updated_at: new Date().toISOString()
                })
                .eq('id', integ.id);

            if (updateError) console.error("Could not update token in DB:", updateError);

            return data.access_token;
        }

        // Token is still valid!
        return integ.access_token;
    } catch (err) {
        console.error("Error in getValidGoogleToken:", err);
        return null;
    }
};

/**
 * Ensures a Doctor has a specific sub-calendar in the master Google Account.
 * If not, it creates it and updates the doctor's record in Supabase.
 */
export const getOrCreateDoctorCalendar = async (doctor, token) => {
    if (!token || !doctor) return null;

    // Fast path: Already exists in DB
    if (doctor.google_calendar_id) {
        return doctor.google_calendar_id;
    }

    try {
        // Create new calendar
        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                summary: `Curae - ${doctor.name}`,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to create sub-calendar for doctor in Google');
        }

        const data = await response.json();
        const newCalendarId = data.id;

        // Save back to Supabase
        await supabase
            .from('doctors')
            .update({ google_calendar_id: newCalendarId })
            .eq('id', doctor.id);

        return newCalendarId;
    } catch (e) {
        console.error("Error creating doctor calendar", e);
        return null; // Fallback to primary if failed? Best to return null so we don't mess up primary.
    }
};

export const createGoogleCalendarEvent = async (appointmentData, doctor, token) => {
    if (!token) return { success: false, error: 'No Google Token' };

    try {
        const calendarId = await getOrCreateDoctorCalendar(doctor, token) || 'primary';
        // We construct the DateTime strictly from the strings to avoid Browser JS shift
        // Example: '2026-02-20' and '09:00' using local machine's timezone.
        const startDateTime = DateTime.fromISO(`${appointmentData.date}T${appointmentData.start_time}`);
        const endDateTime = DateTime.fromISO(`${appointmentData.date}T${appointmentData.end_time}`);

        const eventPayload = {
            summary: appointmentData.patient_name || 'Cita Curae (Sin paciente)',
            description: `Servicio: ${appointmentData.motivo || 'Consulta'}\nNotas: ${appointmentData.notes || 'N/A'}\nId Curae: ${appointmentData.id}`,
            start: {
                dateTime: startDateTime.toISO(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            end: {
                dateTime: endDateTime.toISO(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
        };

        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventPayload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to create event in Google Calendar');
        }

        const data = await response.json();
        return { success: true, eventId: data.id };

    } catch (error) {
        console.error("Google Calendar Sync Error:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Fetches recent external events from a doctor's Google calendar
 * to display in Curae (grey generic events).
 */
export const fetchExternalEvents = async (doctor, token, timeMin, timeMax) => {
    if (!token || !doctor?.google_calendar_id) return [];

    try {
        const query = new URLSearchParams({
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
            singleEvents: 'true',
            orderBy: 'startTime'
        });

        const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(doctor.google_calendar_id)}/events?${query.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to fetch events');

        const data = await res.json();

        // Filter out events that were created by Curae to avoid duplicates
        // We know Curae events have 'Id Curae:' in their description.
        const externalEvents = (data.items || []).filter(item => {
            const desc = item.description || '';
            return !desc.includes('Id Curae:');
        });

        return externalEvents.map(item => {
            const start = item.start.dateTime || item.start.date;
            const end = item.end.dateTime || item.end.date;

            const startDate = new Date(start);
            const endDate = new Date(end);

            return {
                id: `google-${item.id}`,
                title: item.summary || 'Cita Google Calendar',
                date: start.split('T')[0],
                startTime: start.includes('T') ? start.split('T')[1].substring(0, 5) : '00:00',
                duration: (endDate - startDate) / 60000, // minutes
                doctorId: doctor.id,
                color: '#94a3b8', // Slate grey for external events
                notes: 'Importado de Google Calendar',
                type: 'event'
            };
        });

    } catch (e) {
        console.error("Error fetching external events:", e);
        return [];
    }
};
