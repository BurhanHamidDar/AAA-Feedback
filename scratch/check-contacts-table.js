const fs = require('fs');

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
  // Check student_contacts
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/student_contacts?limit=1`, {
      headers: {
        'apikey': supabaseServiceRoleKey,
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        'Range': '0-0'
      }
    });
    console.log("student_contacts status:", res.status);
    if (res.ok) {
      console.log("student_contacts headers keys (if any):", res.headers.get('content-range'));
      const data = await res.json();
      console.log("student_contacts columns:", data[0] ? Object.keys(data[0]) : "Empty table");
    } else {
      console.log("Error details:", await res.text());
    }
  } catch (err) {
    console.error("student_contacts check failed:", err);
  }

  // Check feedback columns via a select=* query or checking columns endpoint if available
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/feedback?select=*&limit=1`, {
      headers: {
        'apikey': supabaseServiceRoleKey,
        'Authorization': `Bearer ${supabaseServiceRoleKey}`
      }
    });
    console.log("feedback status:", res.status);
    if (res.ok) {
      const data = await res.json();
      console.log("feedback row details:", data);
    }
  } catch (err) {
    console.error("feedback check failed:", err);
  }
}

run();
