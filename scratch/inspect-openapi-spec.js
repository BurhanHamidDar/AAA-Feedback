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
  const res = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      'apikey': supabaseServiceRoleKey,
      'Authorization': `Bearer ${supabaseServiceRoleKey}`
    }
  });
  const spec = await res.json();
  
  console.log("\n--- Feedback columns from OpenAPI ---");
  const feedbackProps = spec.definitions?.feedback?.properties || {};
  console.log(Object.keys(feedbackProps));

  console.log("\n--- Students columns from OpenAPI ---");
  const studentsProps = spec.definitions?.students?.properties || {};
  console.log(Object.keys(studentsProps));
}

run();
