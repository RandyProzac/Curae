const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
    console.log('Iniciando sincronización de trabajos de laboratorio antiguos...');
    
    // 1. Get all laboratory works
    const { data: labWorks, error: err1 } = await supabase.from('laboratory_works').select('*, patient:patients(first_name, last_name)');
    if (err1) {
        console.error('Error fetching lab works:', err1);
        return;
    }
    
    // 2. Get all expenses
    const { data: expenses, error: err2 } = await supabase.from('expenses').select('*');
    if (err2) {
        console.error('Error fetching expenses:', err2);
        return;
    }

    let synced = 0;

    for (const lw of labWorks || []) {
        if (lw.cost > 0) {
            // Check if there is already an expense with this LabID
            const exp = expenses.find(e => e.description && e.description.includes('#LabID:' + lw.id));
            if (!exp) {
                const patientName = lw.patient ? `${lw.patient.first_name || ''} ${lw.patient.last_name || ''}`.trim() : 'Paciente Desconocido';
                const description = `Laboratorio: ${lw.work_type} - Paciente: ${patientName} #LabID:${lw.id}`;
                
                console.log(`[+] Creando gasto para: ${lw.work_type} (S/ ${lw.cost}) del ${lw.sent_date}`);
                
                const { error: insertErr } = await supabase.from('expenses').insert([{
                    date: lw.sent_date,
                    description: description,
                    supplier: lw.laboratory_name || 'Laboratorio',
                    category: 'Laboratorio',
                    amount: lw.cost,
                    status: lw.status === 'INSTALADO' ? 'pagado' : 'pendiente',
                    doctor_id: lw.doctor_id || null,
                    type: 'OPERATIVO'
                }]);

                if (insertErr) {
                    console.error('Error insertando gasto:', insertErr);
                } else {
                    synced++;
                }
            }
        }
    }

    console.log(`\n¡Sincronización completada! Se crearon ${synced} gastos que faltaban en el historial.`);
}

run();
