import { logger } from "./logger";

export let hasSubmitterType = false;
export let hasParentFields = false;
export let hasSystemSettingsTable = false;

let isDetected = false;

export async function detectSchemaExtensions(): Promise<void> {
  if (isDetected) return;

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      logger.warn("Schema Detection: Missing credentials, defaulting schema extension flags to false");
      return;
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseServiceRoleKey,
        'Authorization': `Bearer ${supabaseServiceRoleKey}`
      }
    });

    if (res.ok) {
      const spec = (await res.json()) as any;
      const definitions = spec.definitions || {};

      const feedbackProps = Object.keys(definitions.feedback?.properties || {});
      const studentsProps = Object.keys(definitions.students?.properties || {});

      hasSubmitterType = feedbackProps.includes("submitter_type");
      hasParentFields = studentsProps.includes("parent_name");
      hasSystemSettingsTable = "system_settings" in definitions;

      isDetected = true;
      logger.info(`Schema Detection: submitter_type exists = ${hasSubmitterType}, parent ERP fields exist = ${hasParentFields}, system_settings table exists = ${hasSystemSettingsTable}`);
    } else {
      logger.warn(`Schema Detection: Could not load OpenAPI spec (status ${res.status}), defaulting extension flags to false`);
    }
  } catch (err) {
    logger.error("Schema Detection failed, defaulting extension flags to false:", err);
  }
}
