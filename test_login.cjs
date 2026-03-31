require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'asistencia@curae.com',
    password: 'asistencia123'
  });
  console.log("Login Error for asistencia:", error ? error.message : "Success");
  
  const res2 = await supabase.auth.signInWithPassword({
    email: 'luciana@curae.com',
    password: 'luciana123' // assuming this is her pass for testing, if it fails it will say Invalid Credentials, not Schema Error
  });
  console.log("Login Error for luciana:", res2.error ? res2.error.message : "Success");
}

test();
