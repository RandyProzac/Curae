require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'asistencia@curae.com',
    password: 'asistencia123'
  });
  console.log("Login Error:", error ? error.message : "Success");
}

test();
