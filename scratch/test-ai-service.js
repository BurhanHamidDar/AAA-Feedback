const fs = require('fs');

// Manually parse .env and set env variables
const envPath = 'c:/Users/Burhan/Documents/AAA-Feedback-System/apps/backend/.env';
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    process.env[match[1]] = value;
  }
});

// Import the compiled JS file from dist
const { analyzeFeedback } = require('../apps/backend/dist/services/ai/analyzeFeedback');

async function run() {
  const texts = [
    "Math teacher is always abusing everyone . Not talking in a good way to any of student.",
    "I am being abused by a teacher"
  ];

  for (const text of texts) {
    console.log(`\nAnalyzing: "${text}"`);
    try {
      const result = await analyzeFeedback(text);
      console.log("Result:", result);
    } catch (err) {
      console.error("Error:", err);
    }
  }
}

run();
