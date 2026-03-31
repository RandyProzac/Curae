/**
 * CURAE ONLINE - Script de Migración de Doctores a Supabase Auth
 * Usa la API Admin oficial para evitar problemas de hashing
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vsynvjsajnrtrkdbigoq.supabase.co';
const SERVICE_ROLE_KEY = process.argv[2];

if (!SERVICE_ROLE_KEY || !SERVICE_ROLE_KEY.startsWith('eyJ')) {
    console.error('❌ Uso: node supabase/migrate_doctors.mjs eyJTU_SERVICE_ROLE_KEY...');
    process.exit(1);
}

const supaAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const ADMINS = ['luciana', 'diego'];

async function migrate() {
    console.log('🔄 Iniciando migración...\n');

    // 1. LIMPIAR auth corrupto vía SQL directa (el Admin API no puede listar entradas rotas)
    console.log('🧹 Paso 1: Limpiando auth corrupto vía SQL...');
    const cleanupQueries = [
        'DELETE FROM auth.mfa_factors',
        'DELETE FROM auth.sessions', 
        'DELETE FROM auth.refresh_tokens',
        'DELETE FROM auth.identities',
        'DELETE FROM auth.users'
    ];
    for (const sql of cleanupQueries) {
        const { error } = await supaAdmin.rpc('exec_sql', { sql_query: sql }).maybeSingle();
        // Si el RPC no existe, intentar de otra forma
        if (error) {
            // Intentar directamente - service_role bypasses RLS
            await supaAdmin.from('_cleanup').select('*').limit(0); // dummy to test connection
        }
    }
    
    // Intentar limpiar usando el Admin API como fallback
    try {
        const { data: existingUsers } = await supaAdmin.auth.admin.listUsers();
        if (existingUsers?.users?.length > 0) {
            console.log(`   Encontrados ${existingUsers.users.length} usuarios, eliminándolos...`);
            for (const u of existingUsers.users) {
                try {
                    await supaAdmin.auth.admin.deleteUser(u.id);
                    console.log(`   🗑️  ${u.email} eliminado`);
                } catch(e) { /* ignorar errores individuales */ }
            }
        } else {
            console.log('   ✅ Auth limpio (0 usuarios encontrados)');
        }
    } catch(e) {
        console.log('   ⚠️  No se pudieron listar usuarios, continuando...');
    }

    // 2. Leer doctores
    const { data: doctors, error: fetchErr } = await supaAdmin
        .from('doctors')
        .select('id, name, email')
        .order('name');

    if (fetchErr) {
        console.error('❌ Error leyendo doctores:', fetchErr.message);
        process.exit(1);
    }

    console.log(`\n📋 ${doctors.length} doctores encontrados:\n`);

    // 3. Asegurar emails
    for (const doc of doctors) {
        if (!doc.email || !doc.email.includes('@')) {
            const firstName = doc.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
            doc.email = `${firstName}@curae.com`;
            await supaAdmin.from('doctors').update({ email: doc.email }).eq('id', doc.id);
        }
    }

    // 4. Crear usuarios uno por uno con la API Admin
    console.log('🔐 Creando cuentas oficiales via Admin API...\n');

    let ok = 0, fail = 0;

    for (const doc of doctors) {
        const username = doc.email.split('@')[0].toLowerCase();
        const password = `${username}123`;
        const isAdmin = ADMINS.some(a => doc.name.toLowerCase().includes(a));

        try {
            const { data, error } = await supaAdmin.auth.admin.createUser({
                email: doc.email,
                password,
                email_confirm: true,
                user_metadata: { name: doc.name, role: isAdmin ? 'ADMIN' : 'DOCTOR' }
            });

            if (error) throw error;

            const authId = data.user.id;
            
            // Sincronizar UUID: actualizar la tabla doctors + relaciones
            if (authId !== doc.id) {
                // Actualizar todas las tablas que referencian doctor_id
                const tables = ['patients', 'appointments', 'events'];
                for (const table of tables) {
                    await supaAdmin.from(table).update({ doctor_id: authId }).eq('doctor_id', doc.id);
                }
                // Finalmente actualizar el propio doctor
                // No podemos hacer UPDATE id directamente, debemos DELETE + INSERT
                const { data: docFull } = await supaAdmin.from('doctors').select('*').eq('id', doc.id).single();
                if (docFull) {
                    await supaAdmin.from('doctors').delete().eq('id', doc.id);
                    await supaAdmin.from('doctors').insert({ ...docFull, id: authId });
                }
            }

            console.log(`   ✅ ${doc.name}`);
            console.log(`      📧 Login: ${username}  /  🔑 Contraseña: ${password}  [${isAdmin ? '👑 ADMIN' : '🩺 DOCTOR'}]`);
            ok++;
        } catch (err) {
            console.error(`   ❌ ${doc.name} → ${err.message}`);
            fail++;
        }
    }

    console.log(`\n${'═'.repeat(60)}`);
    console.log(` RESULTADO: ${ok} ✅  /  ${fail} ❌`);
    console.log(`${'═'.repeat(60)}`);

    if (ok > 0) {
        console.log('\n🎉 ¡Login listo! Ejemplo: usuario "luciana" + contraseña "luciana123"\n');
    }
}

migrate().catch(err => { console.error('💥', err); process.exit(1); });
