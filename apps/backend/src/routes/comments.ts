import { Router } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { supabase } from "../config/supabase";
import { AddCommentSchema } from "@aaa-feedback/shared";

const router: Router = Router({ mergeParams: true });

router.use(requireAuth);

/**
 * GET /feedback/:feedbackId/comments
 * Returns all comments for a feedback item.
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { feedbackId } = req.params;

    const { data, error } = await supabase
      .from("feedback_comments")
      .select("*, admins(id, name, role)")
      .eq("feedback_id", feedbackId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    res.json({ success: true, data: data ?? [] });
  })
);

/**
 * POST /feedback/:feedbackId/comments
 * Adds a comment to a feedback item.
 */
router.post(
  "/",
  validate(AddCommentSchema),
  asyncHandler(async (req, res) => {
    const authedReq = req as AuthenticatedRequest;
    const { feedbackId } = req.params;
    const { comment_text } = req.body as { comment_text: string };

    const { data, error } = await supabase
      .from("feedback_comments")
      .insert({
        feedback_id: feedbackId,
        admin_id: authedReq.adminId,
        comment_text,
      })
      .select("*, admins(id, name, role)")
      .single();

    if (error) throw error;

    // Audit log
    await supabase.from("audit_logs").insert({
      admin_id: authedReq.adminId,
      action: "comment_added",
      entity_type: "feedback",
      entity_id: feedbackId,
      new_value: { comment_text },
    });

    res.status(201).json({ success: true, data });
  })
);

export default router;
