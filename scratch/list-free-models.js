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

async function run() {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models");
    const json = await res.json();
    if (!json.data) {
      console.error("Invalid response from OpenRouter API:", json);
      return;
    }
    const freeModels = json.data.filter(m => m.id.endsWith(':free') || (m.pricing && parseFloat(m.pricing.prompt) === 0));
    console.log(`Found ${freeModels.length} free models on OpenRouter:\n`);
    freeModels.forEach(m => {
      console.log(`- ID: ${m.id}`);
      console.log(`  Name: ${m.name}`);
      console.log(`  Context Length: ${m.context_length}`);
    });
  } catch (err) {
    console.error("Error:", err.message);
  }
}

run();
