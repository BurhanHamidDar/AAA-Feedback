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
  const testPhone = "236622683627630"; // Phone number from user's whatsapp_sessions
  console.log(`Updating student_contacts entry to use test phone: ${testPhone}`);

  // Fetch the current father record
  const { data: contacts, error: fetchError } = await supabase
    .from('student_contacts')
    .select('*')
    .eq('relationship', 'Father')
    .limit(1);

  if (fetchError || !contacts || contacts.length === 0) {
    console.error("Could not find any contact row to update:", fetchError?.message || "No row found");
    return;
  }

  const contact = contacts[0];
  console.log("Found contact to update:", contact);

  // Update the phone number to the test JID phone
  const { data, error } = await supabase
    .from('student_contacts')
    .update({ phone_number: testPhone })
    .eq('id', contact.id)
    .select();

  if (error) {
    console.error("Failed to update contact:", error.message);
  } else {
    console.log("Success! Updated contact row:", data);
  }
}

run();
