const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    console.log("Querying appointments on 2026-06-01...");
    const { data: appointments, error } = await supabase
        .from('appointments')
        .select('id, patient_id, doctor_id, date, start_time, end_time, google_calendar_event_id, patient:patients(first_name, last_name)')
        .eq('date', '2026-06-01');

    if (error) {
        console.error("Error fetching appointments:", error);
        return;
    }

    console.log("\nAppointments found in database:");
    appointments.forEach(apt => {
        const patientName = apt.patient ? `${apt.patient.first_name} ${apt.patient.last_name}` : 'Sin paciente';
        console.log(`- ID: ${apt.id}`);
        console.log(`  Patient: ${patientName}`);
        console.log(`  Time: ${apt.start_time} - ${apt.end_time}`);
        console.log(`  Google Calendar Event ID: ${apt.google_calendar_event_id}`);
    });
}
main();
