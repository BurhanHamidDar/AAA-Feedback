const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function run() {
  const { data, error } = await supabase.rpc('execute_sql', {
    sql_query: "SELECT * FROM pg_policies WHERE tablename = 'feedback';"
  });

  if (error) {
    // If RPC isn't available, try direct SQL if we can, or query using REST API if possible
    console.error("RPC error:", error);
    
    // Let's try executing via standard REST if there's any config, or just query pg_policies using custom query
    // Wait, Supabase REST API doesn't expose arbitrary SQL execution unless there's a custom function.
    // Let's check if we can write a quick query to list policies using a known table or if we can run it.
  } else {
    console.log("Policies:", data);
  }
}

// Since arbitrary SQL might not be enabled via RPC 'execute_sql', let's write another way to fetch policies if it fails.
// Let's try to query the schema directly if pg_policies is exposed or write a script that connects via pg client.
// Wait, we don't have pg client installed unless it's in package.json. Let's check if we can query pg_policies via supabase.from().
async function runWithPG() {
  // Let's see if we have pg package. In package.json we didn't see pg, but let's check if we can find db connection string.
  // Wait, let's just query pg_policies through a standard table if it's not restricted, or we can check schema.sql.
}

run();
