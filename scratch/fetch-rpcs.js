const fs = require('fs');

// Parse .env manually
const envPath = 'c:/Users/Burhan/Documents/AAA-Feedback-System/apps/backend/.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const supabaseUrl = env.SUPABASE_URL;
const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  console.log("Fetching OpenAPI spec from PostgREST...");
  const res = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      'apikey': supabaseServiceRoleKey,
      'Authorization': `Bearer ${supabaseServiceRoleKey}`
    }
  });
  if (!res.ok) {
    console.error("Failed to fetch OpenAPI spec:", res.status, await res.text());
    return;
  }
  const spec = await res.json();
  console.log("\n--- Exposed RPC / Stored Procedures ---");
  const paths = Object.keys(spec.paths || {});
  const rpcs = paths.filter(p => p.startsWith('/rpc/'));
  console.log(rpcs);
}

run();
