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

const { createClient } = require('c:/Users/Burhan/Documents/AAA-Feedback-System/apps/backend/node_modules/@supabase/supabase-js');
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase
    .from('whatsapp_sessions')
    .select('*');

  if (error) {
    console.error("Error fetching sessions:", error.message);
  } else {
    console.log(`Found ${data.length} sessions in whatsapp_sessions table:`);
    console.log(JSON.stringify(data, null, 2));
  }
}

run();
