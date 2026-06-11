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

const supabaseUrl = env.SUPABASE_URL;
const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env!");
  console.log("Parsed keys:", Object.keys(env));
  process.exit(1);
}

// 2. Query Supabase Rest API using standard fetch
async function run() {
  console.log("Using REST API at:", supabaseUrl);
  
  // Test students columns by requesting 1 row and reading response keys
  try {
    const studentRes = await fetch(`${supabaseUrl}/rest/v1/students?limit=1`, {
      headers: {
        'apikey': supabaseServiceRoleKey,
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        'Range': '0-0'
      }
    });
    if (!studentRes.ok) {
      const errText = await studentRes.text();
      throw new Error(`Students API error: ${studentRes.status} ${errText}`);
    }
    const students = await studentRes.json();
    console.log("\n--- Students Table Columns ---");
    console.log(students[0] ? Object.keys(students[0]) : "No students found in DB");
  } catch (err) {
    console.error("Failed to query students:", err.message);
  }

  // Test feedback columns by requesting 1 row and reading response keys
  try {
    const feedbackRes = await fetch(`${supabaseUrl}/rest/v1/feedback?limit=1`, {
      headers: {
        'apikey': supabaseServiceRoleKey,
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        'Range': '0-0'
      }
    });
    if (!feedbackRes.ok) {
      const errText = await feedbackRes.text();
      throw new Error(`Feedback API error: ${feedbackRes.status} ${errText}`);
    }
    const feedback = await feedbackRes.json();
    console.log("\n--- Feedback Table Columns ---");
    console.log(feedback[0] ? Object.keys(feedback[0]) : "No feedback found in DB");
  } catch (err) {
    console.error("Failed to query feedback:", err.message);
  }
}

run();
