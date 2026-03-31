require('dotenv').config();
const https = require('https');
const URL = require('url').URL;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// First list all users to find asistencia's current UUID
function apiRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SUPABASE_URL);
    const bodyStr = body ? JSON.stringify(body) : null;
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {})
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function main() {
  // List users and find asistencia
  console.log('Buscando usuarios...');
  const list = await apiRequest('GET', '/auth/v1/admin/users?per_page=100', null);
  
  if (!list.body.users) {
    console.log('Error listando usuarios:', JSON.stringify(list.body));
    return;
  }

  const existing = list.body.users.find(u => u.email === 'asistencia@curae.com');
  if (existing) {
    console.log('Usuario asistencia encontrado, ID:', existing.id);
    console.log('Eliminando...');
    const del = await apiRequest('DELETE', `/auth/v1/admin/users/${existing.id}`, null);
    console.log('Delete status:', del.status);
  } else {
    console.log('No hay usuario asistencia en Auth. Bien, creando...');
  }

  // Now create fresh via Admin API
  console.log('Creando usuario...');
  const create = await apiRequest('POST', '/auth/v1/admin/users', {
    email: 'asistencia@curae.com',
    password: 'asistencia123',
    email_confirm: true,
    user_metadata: { name: 'Asistencia Curae', role: 'ADMIN' }
  });

  if (create.status === 200 || create.status === 201) {
    console.log('\n✅ CREADO! ID:', create.body.id);
    console.log('\nEjecuta este SQL en Supabase:');
    console.log(`DELETE FROM public.doctors WHERE email = 'asistencia@curae.com';
INSERT INTO public.doctors (id, name, email, specialty, active, created_at)
VALUES ('${create.body.id}', 'Asistencia Curae', 'asistencia@curae.com', 'ADMINISTRACION', true, now());`);
  } else {
    console.log('\n❌ Error creando:', create.status, JSON.stringify(create.body, null, 2));
  }
}

main();
