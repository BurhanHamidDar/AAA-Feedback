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

const apiKey = process.env.OPENROUTER_API_KEY;
console.log("Using API Key:", apiKey ? apiKey.substring(0, 10) + "..." : "undefined");

const modelsToTest = [
  "openrouter/free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "google/gemma-4-31b-it:free",
  "liquid/lfm-2.5-1.2b-instruct:free",
  "poolside/laguna-xs.2:free"
];

const testText = "Math teacher is always abusing everyone. Not talking in a good way to any of student.";

async function callModel(model, text) {
  const systemPrompt = `You are the AI Assistant for AAA Feedback, the official feedback management platform of Ayesha Ali Academy.
Your task is to analyze feedback submitted by students, parents, and staff, summarize it, and classify it.

You must return a raw JSON object matching the following structure:
{
  "summary": "A concise, professional one-sentence summary in English, summarizing the main concern (max 120 characters). Do not include intro/outro words.",
  "category": "Academics" | "Transport" | "Infrastructure" | "Staff" | "Discipline" | "Administration" | "Facilities" | "Safety" | "General" | "Other",
  "sentiment": "Positive" | "Neutral" | "Negative" | "Mixed",
  "priority": "Low" | "Medium" | "High" | "Critical"
}

Classification Rules:
- category:
  - "Academics": lessons, homework, exams, grades, teacher quality, curriculum, or school books.
  - "Transport": school bus, routes, pickup/drop times, driver behavior, transportation issues.
  - "Infrastructure": school building, classrooms, toilets, heating/cooling, labs, boundary walls, desks.
  - "Staff": behavior of non-teaching staff, administration staff, security guards, office clerks.
  - "Discipline": bullying, student behavior, rules enforcement, dress code, fighting, uniform.
  - "Administration": fee payment, admissions, calendar, school communications, principal decisions, circulars.
  - "Facilities": playground, sports equipment, canteen, library, computer room, drinking water.
  - "Safety": physical security, hazards, road crossing safety, internet safety, security threats.
  - "General": general suggestions, appreciation, generic remarks, or queries that don't fit complaints.
  - "Other": anything else that does not match the above.
- sentiment:
  - "Positive": appreciation, praise, happy feedback.
  - "Negative": complaints, issues, problems, worries.
  - "Neutral": standard queries, suggestions without strong emotion.
  - "Mixed": contains both positive praise and serious complaints/issues.
- priority:
  - "Critical": physical safety hazards, active bullying, child protection issues, major safety failures.
  - "High": serious teaching quality concerns, major bus delays (>30 mins), broken heating/cooling in extreme weather.
  - "Medium": standard complaints, suggestions, queries, standard feedback.
  - "Low": general remarks, appreciation, minor suggestions.

Response Format:
- Return ONLY valid JSON.
- Do NOT wrap in markdown code blocks like \`\`\`json.
- Do NOT include any additional comments or text outside the JSON object.
- Make sure keys and values are exactly as defined above (case-sensitive).`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/ayesha-ali-academy/feedback-system",
        "X-Title": "AAA Feedback Redesign"
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Feedback raw text: "${text.replace(/"/g, '\\"')}"` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return `HTTP ${response.status}: ${errorText}`;
    }

    const resBody = await response.json();
    return resBody.choices?.[0]?.message?.content || JSON.stringify(resBody);
  } catch (err) {
    return `Error: ${err.message}`;
  }
}

async function run() {
  for (const model of modelsToTest) {
    console.log(`\n=================== Testing Model: ${model} ===================`);
    const result = await callModel(model, testText);
    console.log("Response:", result);
  }
}

run();
