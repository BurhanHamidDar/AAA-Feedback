import { Router } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { supabase } from "../config/supabase";
import { logger } from "../utils/logger";
import { asyncHandler } from "../utils/asyncHandler";
import { hasSystemSettingsTable } from "../utils/schema";

const router: Router = Router();

/**
 * GET /api/settings
 * Retrieve system settings (like feedback collection status). Requires auth.
 */
router.get(
  "/",
  requireAuth,
  asyncHandler(async (_req, res) => {
    if (!hasSystemSettingsTable) {
      logger.warn("GET Settings: system_settings table does not exist in database, returning defaults");
      res.json({
        success: true,
        data: {
          feedback_collection_enabled: true,
          ai_analysis_enabled: true,
          require_student_verification: true,
          ai_model_preference: "standard",
          system_settings_missing: true,
        },
      });
      return;
    }

    const { data, error } = await supabase
      .from("system_settings")
      .select("*");

    if (error) {
      logger.error("Error fetching system settings:", error);
      throw error;
    }

    // Reduce key-value rows to an object
    const settings = (data || []).reduce((acc, cur) => {
      acc[cur.key] = cur.value;
      return acc;
    }, {} as Record<string, any>);

    // Ensure default fallback value
    if (settings.feedback_collection_enabled === undefined) {
      settings.feedback_collection_enabled = true;
    }

    res.json({
      success: true,
      data: settings,
    });
  })
);

/**
 * POST /api/settings
 * Secure endpoint to update system settings. Only authenticated admins can modify.
 */
router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const authedReq = req as AuthenticatedRequest;
    const body = req.body as Record<string, any>;

    if (!hasSystemSettingsTable) {
      logger.warn("POST Settings: system_settings table does not exist, updates will not be saved permanently");
      res.json({
        success: true,
        message: "Settings simulated successfully. Please paste the SQL registry code from migrations to create the system_settings table.",
        simulated: true,
      });
      return;
    }

    for (const [key, value] of Object.entries(body)) {
      const { error } = await supabase
        .from("system_settings")
        .upsert({
          key,
          value,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        logger.error(`Error updating setting '${key}':`, error);
        throw error;
      }

      logger.info(`System Setting: '${key}' updated to ${JSON.stringify(value)} by admin ID ${authedReq.adminId}`);
    }

    res.json({
      success: true,
      message: "Settings updated successfully.",
    });
  })
);

export default router;
