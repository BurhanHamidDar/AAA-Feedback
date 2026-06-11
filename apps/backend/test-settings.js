require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkOpenApiSpec() {
  try {
    console.log("Fetching OpenAPI spec...");
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseServiceRoleKey,
        'Authorization': `Bearer ${supabaseServiceRoleKey}`
      }
    });
    
    if (res.ok) {
      const spec = await res.json();
      const tables = Object.keys(spec.definitions || {});
      console.log("Tables found in database OpenAPI definitions:", tables);
    } else {
      console.error("Failed to fetch spec, status:", res.status);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

checkOpenApiSpec();
