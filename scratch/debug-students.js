const fs = require('fs');
const path = require('path');

const envPath = 'c:/Users/Burhan/Documents/AAA-Feedback-System/apps/backend/.env';
if (!fs.existsSync(envPath)) {
  console.error("Could not find .env file at:", envPath);
  process.exit(1);
}

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

const { createClient } = require('c:/Users/Burhan/Documents/AAA-Feedback-System/apps/backend/node_modules/@supabase/supabase-js');
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("Fetching students...");
  const { data: students, error } = await supabase
    .from('students')
    .select('*');

  if (error) {
    console.error("Error:", error.message);
    return;
  }

  console.log(`Found ${students.length} students:`);
  students.forEach(s => {
    console.log(`ID: ${s.id} | Name: ${s.student_name} | Adm: ${s.admission_no} | ParentName: ${s.parent_name} | ParentPhone: ${s.parent_phone}`);
  });
}

run();
