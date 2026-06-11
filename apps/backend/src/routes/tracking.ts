import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { supabase } from "../config/supabase";
import { logger } from "../utils/logger";

const router: Router = Router();

/**
 * GET /api/tracking/:tracking_number
 * Public feedback status and timeline lookup by tracking number.
 * Enforces strict security by only returning non-identifying fields.
 */
router.get(
  "/:tracking_number",
  asyncHandler(async (req, res) => {
    const { tracking_number } = req.params;

    if (!tracking_number || typeof tracking_number !== "string") {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_INPUT", message: "Tracking number is required and must be a string" },
      });
      return;
    }

    const formattedTracking = (tracking_number as string).trim().toUpperCase();


    // Query feedback table - select only safe public-facing metadata
    const { data: feedback, error: feedbackErr } = await supabase
      .from("feedback")
      .select("id, tracking_number, status, category, last_action_note, status_updated_at, created_at")
      .eq("tracking_number", formattedTracking)
      .maybeSingle();

    if (feedbackErr) {
      logger.error(`Error querying tracking number ${formattedTracking}:`, feedbackErr);
      throw feedbackErr;
    }

    if (!feedback) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: `Feedback reference ${formattedTracking} not found.` },
      });
      return;
    }

    // Query timeline for the feedback item, ordered chronologically
    const { data: timeline, error: timelineErr } = await supabase
      .from("feedback_timeline")
      .select("id, status, action_note, created_at")
      .eq("feedback_id", feedback.id)
      .order("created_at", { ascending: true });

    if (timelineErr) {
      logger.error(`Error querying timeline for feedback ${feedback.id}:`, timelineErr);
      throw timelineErr;
    }

    res.json({
      success: true,
      data: {
        tracking_number: feedback.tracking_number,
        status: feedback.status,
        category: feedback.category,
        last_action_note: feedback.last_action_note,
        status_updated_at: feedback.status_updated_at,
        created_at: feedback.created_at,
        timeline: timeline ?? [],
      },
    });
  })
);

export default router;
