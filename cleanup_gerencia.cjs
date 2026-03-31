const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function deleteUnwantedUser() {
  const email = 'gerencia@curae.com';
  console.log(`🔍 Buscando usuario: ${email}...`);

  // Intentar buscar por email directamente para evitar el error de listado masivo
  const { data: { user }, error: findError } = await supabaseAdmin.auth.admin.getUserByEmail(email);
  
  if (findError) {
    console.error('❌ Error al buscar usuario:', findError.message);
    return;
  }

  if (!user) {
    console.log(`ℹ️ El usuario ${email} no existe o ya fue eliminado.`);
    return;
  }

  const userId = user.id;
  console.log(`✅ Usuario encontrado con ID: ${userId}`);

  // 2. Eliminar de public.doctors (perfil público)
  const { error: dbError } = await supabaseAdmin
    .from('doctors')
    .delete()
    .eq('id', userId);

  if (dbError) {
    console.error('⚠️ Error al eliminar de public.doctors:', dbError.message);
  } else {
    console.log('🗑️ Perfil de doctor eliminado.');
  }

  // 3. Eliminar de auth.users (cuenta principal)
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (authError) {
    console.error('❌ Error al eliminar de auth:', authError.message);
  } else {
    console.log(`✨ Usuario ${email} eliminado de forma definitiva.`);
  }
}

deleteUnwantedUser();
