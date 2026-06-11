const fs = require('fs');
const path = require('path');

// 1. Manually parse .env without external library
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
    // Remove quotes
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const { createClient } = require('c:/Users/Burhan/Documents/AAA-Feedback-System/apps/backend/node_modules/@supabase/supabase-js');
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("Fetching students from Supabase...");
  const { data: students, error: studentErr } = await supabase
    .from('students')
    .select('id, student_name, parent_name, parent_phone, guardian_name, guardian_phone');

  if (studentErr) {
    console.error("Error fetching students:", studentErr.message);
    process.exit(1);
  }

  console.log(`Found ${students.length} students. Fetching existing contacts...`);
  const { data: contacts, error: contactErr } = await supabase
    .from('student_contacts')
    .select('student_id, phone_number, relationship');

  if (contactErr) {
    console.error("Error fetching contacts:", contactErr.message);
    process.exit(1);
  }

  // Create a fast lookup set of existing contact composite keys
  const contactLookup = new Set(
    contacts.map(c => `${c.student_id}_${c.phone_number.trim()}_${c.relationship}`)
  );

  const newContacts = [];

  for (const student of students) {
    // 1. Check parent/father details
    if (student.parent_name && student.parent_phone && student.parent_phone.trim()) {
      const phone = student.parent_phone.trim();
      const key = `${student.id}_${phone}_Father`;
      if (!contactLookup.has(key)) {
        newContacts.push({
          student_id: student.id,
          contact_name: student.parent_name.trim(),
          relationship: 'Father',
          phone_number: phone
        });
      }
    }

    // 2. Check guardian details
    if (student.guardian_name && student.guardian_phone && student.guardian_phone.trim()) {
      const phone = student.guardian_phone.trim();
      const key = `${student.id}_${phone}_Guardian`;
      if (!contactLookup.has(key)) {
        newContacts.push({
          student_id: student.id,
          contact_name: student.guardian_name.trim(),
          relationship: 'Guardian',
          phone_number: phone
        });
      }
    }
  }

  if (newContacts.length === 0) {
    console.log("No new parent contacts need to be synchronized.");
    return;
  }

  console.log(`Synchronizing ${newContacts.length} new parent contacts to student_contacts...`);

  // Batch insert new contacts (chunked by 100 to avoid request limit issues)
  const chunkSize = 100;
  for (let i = 0; i < newContacts.length; i += chunkSize) {
    const chunk = newContacts.slice(i, i + chunkSize);
    const { error: insertErr } = await supabase
      .from('student_contacts')
      .insert(chunk);

    if (insertErr) {
      console.error(`Error inserting chunk starting at index ${i}:`, insertErr.message);
    } else {
      console.log(`Successfully inserted chunk of ${chunk.length} contacts.`);
    }
  }

  console.log("Synchronization complete!");
}

run();
