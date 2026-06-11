/**
 * AAA Feedback — Bulk Student & Contacts Importer
 * 
 * This script imports students and contacts in batches from a CSV file.
 * 
 * Expected CSV columns (students.csv):
 * admission_no, student_name, class, section, father_name, father_phone, mother_name, mother_phone, guardian_name, guardian_phone
 * 
 * Run using: node scratch/bulk-import-students.js path/to/students.csv
 */

const fs = require('fs');
const path = require('path');

// 1. Parse .env manually
const envPath = 'c:/Users/Burhan/Documents/AAA-Feedback-System/apps/backend/.env';
if (!fs.existsSync(envPath)) {
  console.error("Could not find backend .env file at:", envPath);
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

// 2. CSV Parser Helper (simple RFC 4180 parser)
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = [];
  let row = [""];
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push("");
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      if (row.length > 1 || row[0] !== "") {
        lines.push(row);
      }
      row = [""];
    } else {
      row[row.length - 1] += char;
    }
  }
  if (row.length > 1 || row[0] !== "") {
    lines.push(row);
  }
  return lines;
}

async function main() {
  const csvArg = process.argv[2];
  if (!csvArg) {
    console.error("Usage: node scratch/bulk-import-students.js <path-to-csv-file>");
    process.exit(1);
  }

  const csvPath = path.resolve(csvArg);
  if (!fs.existsSync(csvPath)) {
    console.error("CSV file does not exist at:", csvPath);
    process.exit(1);
  }

  console.log("Parsing CSV file...");
  const rows = parseCSV(csvPath);
  if (rows.length < 2) {
    console.error("CSV file is empty or missing data rows.");
    process.exit(1);
  }

  const headers = rows[0].map(h => h.trim().toLowerCase());
  console.log("CSV Headers found:", headers);

  // Map header indexes
  const idx = {
    admission_no: headers.indexOf("admission_no"),
    student_name: headers.indexOf("student_name"),
    class: headers.indexOf("class"),
    section: headers.indexOf("section"),
    father_name: headers.indexOf("father_name"),
    father_phone: headers.indexOf("father_phone"),
    mother_name: headers.indexOf("mother_name"),
    mother_phone: headers.indexOf("mother_phone"),
    guardian_name: headers.indexOf("guardian_name"),
    guardian_phone: headers.indexOf("guardian_phone"),
  };

  if (idx.admission_no === -1 || idx.student_name === -1 || idx.class === -1) {
    console.error("Required headers missing. Make sure CSV has: admission_no, student_name, class");
    process.exit(1);
  }

  const studentRows = rows.slice(1);
  console.log(`Found ${studentRows.length} records to import. Processing...`);

  let successCount = 0;

  for (let i = 0; i < studentRows.length; i++) {
    const row = studentRows[i];
    const admissionNo = row[idx.admission_no]?.trim();
    const studentName = row[idx.student_name]?.trim();
    const studentClass = row[idx.class]?.trim();
    const studentSection = idx.section !== -1 ? row[idx.section]?.trim() || "A" : "A";

    if (!admissionNo || !studentName || !studentClass) {
      console.warn(`Row ${i + 2}: Skipped due to missing required student details.`);
      continue;
    }

    try {
      // 1. Insert/Upsert Student
      const { data: student, error: studentError } = await supabase
        .from('students')
        .upsert({
          admission_no: admissionNo,
          student_name: studentName,
          class: studentClass,
          section: studentSection,
          // Legacy column populate for backwards safety
          parent_name: idx.father_name !== -1 ? row[idx.father_name]?.trim() : null,
          parent_phone: idx.father_phone !== -1 ? row[idx.father_phone]?.trim() : null,
          guardian_name: idx.guardian_name !== -1 ? row[idx.guardian_name]?.trim() : null,
          guardian_phone: idx.guardian_phone !== -1 ? row[idx.guardian_phone]?.trim() : null,
        }, { onConflict: 'admission_no' })
        .select('id')
        .single();

      if (studentError || !student) {
        console.error(`Row ${i + 2} (${studentName}): Student insert error:`, studentError?.message);
        continue;
      }

      // 2. Insert Contacts
      const contactsToInsert = [];

      // Father Contact
      if (idx.father_name !== -1 && idx.father_phone !== -1) {
        const name = row[idx.father_name]?.trim();
        const phone = row[idx.father_phone]?.trim();
        if (name && phone) {
          contactsToInsert.push({ student_id: student.id, contact_name: name, relationship: 'Father', phone_number: phone });
        }
      }

      // Mother Contact
      if (idx.mother_name !== -1 && idx.mother_phone !== -1) {
        const name = row[idx.mother_name]?.trim();
        const phone = row[idx.mother_phone]?.trim();
        if (name && phone) {
          contactsToInsert.push({ student_id: student.id, contact_name: name, relationship: 'Mother', phone_number: phone });
        }
      }

      // Guardian Contact
      if (idx.guardian_name !== -1 && idx.guardian_phone !== -1) {
        const name = row[idx.guardian_name]?.trim();
        const phone = row[idx.guardian_phone]?.trim();
        if (name && phone) {
          contactsToInsert.push({ student_id: student.id, contact_name: name, relationship: 'Guardian', phone_number: phone });
        }
      }

      if (contactsToInsert.length > 0) {
        const { error: contactsError } = await supabase
          .from('student_contacts')
          .upsert(contactsToInsert, { onConflict: 'student_id,phone_number,relationship' });

        if (contactsError) {
          console.error(`Row ${i + 2} (${studentName}): Contacts insert error:`, contactsError.message);
        }
      }

      successCount++;
      if (successCount % 100 === 0) {
        console.log(`Progress: Imported ${successCount}/${studentRows.length} students...`);
      }
    } catch (err) {
      console.error(`Row ${i + 2}: Exception error:`, err.message);
    }
  }

  console.log(`\nImport complete! Successfully imported ${successCount} of ${studentRows.length} student records.`);
}

main();
