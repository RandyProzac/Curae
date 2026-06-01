const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const ids = ['ccbe46cd-dbe3-45eb-9881-b2f78c94c93b', 'c9cf1c32-9f7b-4d55-b8ef-f6ee00a958a7'];
    
    console.log("Fetching detailed info for IDs:", ids);
    const { data, error } = await supabase
        .from('appointments')
        .select('*, patient:patients(*), doctor:doctors(*)')
        .in('id', ids);

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log("Results:");
    console.log(JSON.stringify(data, null, 2));
}
main();
