// Este script usa la API ADMIN de Supabase (service_role) para crear 
// el usuario correctamente, de la misma forma que lo haría el dashboard.
// Requiere que SERVICE_ROLE_KEY esté en el .env

require('dotenv').config();
const https = require('https');
const URL = require('url').URL;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('ERROR: VITE_SUPABASE_SERVICE_ROLE_KEY no está en el .env');
  console.error('Ve a Supabase Dashboard > Project Settings > API > service_role (secret)');
  process.exit(1);
}

async function createUser() {
  const url = new URL('/auth/v1/admin/users', SUPABASE_URL);
  
  const body = JSON.stringify({
    email: 'asistencia@curae.com',
    password: 'asistencia123',
    email_confirm: true,
    user_metadata: { name: 'Asistencia Curae', role: 'ADMIN' }
  });

  const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Length': Buffer.byteLength(body)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const parsed = JSON.parse(data);
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('Creando usuario via Admin API...');
  const result = await createUser();
  
  if (result.status === 200 || result.status === 201) {
    const userId = result.body.id;
    console.log('\n✅ USUARIO CREADO EXITOSAMENTE!');
    console.log('ID:', userId);
    console.log('Email:', result.body.email);
    console.log('\nAhora ejecuta este SQL en Supabase para vincularlo en la tabla doctors:');
    console.log(`
INSERT INTO public.doctors (id, name, email, specialty, active, created_at)
VALUES ('${userId}', 'Asistencia Curae', 'asistencia@curae.com', 'ADMINISTRACION', true, now())
ON CONFLICT (id) DO NOTHING;`);
  } else {
    console.log('\n❌ Error:', result.status, JSON.stringify(result.body, null, 2));
  }
}

main();
