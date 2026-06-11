import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { supabase } from "../config/supabase";

const router: Router = Router();

router.use(requireAuth);

/**
 * GET /clusters
 * Returns all issue clusters, ordered by report count.
 */
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const { data, error } = await supabase
      .from("issue_clusters")
      .select("*")
      .order("report_count", { ascending: false });

    if (error) throw error;

    res.json({ success: true, data: data ?? [] });
  })
);

/**
 * GET /clusters/:id
 * Returns a single cluster with all related feedback.
 */
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("issue_clusters")
      .select(`*, feedback(id, summary, priority, status, created_at)`)
      .eq("id", id)
      .single();

    if (error || !data) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Cluster not found" },
      });
      return;
    }

    res.json({ success: true, data });
  })
);

export default router;
