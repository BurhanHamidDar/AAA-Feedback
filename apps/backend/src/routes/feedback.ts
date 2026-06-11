import { Router } from "express";
import { requireAuth, requirePrincipal, AuthenticatedRequest } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { supabase } from "../config/supabase";
import {
  FeedbackListQuerySchema,
  UpdateFeedbackStatusSchema,
  FeedbackType,
  FeedbackSubmitterType,
} from "@aaa-feedback/shared";
import { logger } from "../utils/logger";
import { analyzeFeedback } from "../services/ai/analyzeFeedback";
import { hasSubmitterType, hasParentFields } from "../utils/schema";

const router: Router = Router();

/**
 * POST /feedback
 * Public endpoint to submit feedback.
 * Does not require authentication. Starts AI processing asynchronously.
 * Requires a verified WhatsApp session for the submitting number.
 */
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { submission_type, submitter_type, raw_text, submitter_name, whatsapp_number } = req.body;

    if (!raw_text || typeof raw_text !== "string" || raw_text.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: "raw_text is required and must be a string" },
      });
      return;
    }

    if (!submission_type || !["anonymous", "principal_only", "contact_me"].includes(submission_type)) {
      res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: "Invalid submission_type" },
      });
      return;
    }

    // Validate submitter_type if provided (defaults to Unknown)
    const validSubmitterTypes = ["Student", "Parent", "Guardian", "Unknown"];
    const resolvedSubmitterType: string =
      submitter_type && validSubmitterTypes.includes(submitter_type)
        ? submitter_type
        : FeedbackSubmitterType.UNKNOWN;

    if (!whatsapp_number || typeof whatsapp_number !== "string" || whatsapp_number.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: "whatsapp_number is required to verify identity" },
      });
      return;
    }

    // 1. Look up parent contacts first (Parent-First Verification)
    const last10 = whatsapp_number.length >= 10 ? whatsapp_number.slice(-10) : whatsapp_number;
    const { data: parentContacts, error: contactsError } = await supabase
      .from("student_contacts")
      .select("*, student:students(*)")
      .like("phone_number", `%${last10}`);

    if (contactsError) {
      logger.error("Failed to query parent contacts for submission:", contactsError);
      res.status(500).json({
        success: false,
        error: { code: "DB_ERROR", message: "Error validating session" },
      });
      return;
    }

    let studentId = null;
    let relationship = null;
    let submitterName = submitter_name || null;
    let submitterType = resolvedSubmitterType;
    let feedbackScope = "student_specific";

    if (parentContacts && parentContacts.length > 0) {
      // Registered Parent
      const selectedContact = parentContacts[0];
      studentId = selectedContact.student_id;
      submitterName = submitterName || selectedContact.contact_name;
      submitterType = selectedContact.relationship === "Guardian" ? "Guardian" : "Parent";
      relationship = selectedContact.relationship;
    } else {
      // Fallback to student verification session
      const { data: session, error: sessionError } = await supabase
        .from("whatsapp_sessions")
        .select("*, students(*)")
        .eq("whatsapp_number", whatsapp_number)
        .maybeSingle();

      if (sessionError) {
        logger.error("Failed to query student session for submission:", sessionError);
        res.status(500).json({
          success: false,
          error: { code: "DB_ERROR", message: "Error validating session" },
        });
        return;
      }

      if (session && session.student_id) {
        studentId = session.student_id;
        submitterName = submitterName || session.students?.student_name || null;
        submitterType = "Student";
      } else {
        logger.warn(`Submission Rejected: Unverified WhatsApp number ${whatsapp_number} attempted to submit feedback.`);
        res.status(403).json({
          success: false,
          error: {
            code: "UNVERIFIED_SESSION",
            message: "This WhatsApp number is not verified. Please verify your Admission Number first.",
          },
        });
        return;
      }
    }

    const isAnonymous = submission_type === "anonymous";

    // 2. Save feedback to database dynamically based on available columns
    const insertPayload: Record<string, any> = {
      submission_type,
      raw_text,
      submitter_name: submitterName || null,
      submitter_phone: whatsapp_number || null,
      status: "new",
      ai_processed: false,
      student_id: studentId,
      is_anonymous: isAnonymous,
      verification_status: "verified",
      verified_at: new Date().toISOString(),
      feedback_scope: feedbackScope,
      submitter_relationship: relationship,
    };

    if (hasSubmitterType) {
      insertPayload.submitter_type = submitterType;
    }

    const { data: feedback, error } = await supabase
      .from("feedback")
      .insert(insertPayload)
      .select()
      .single();

    if (error || !feedback) {
      logger.error("Failed to insert submitted feedback:", error);
      res.status(500).json({
        success: false,
        error: { code: "DB_ERROR", message: "Failed to save feedback" },
      });
      return;
    }

    // 3. Log feedback submission audit trail
    await supabase.from("audit_logs").insert({
      action: isAnonymous ? "anonymous_submission" : "feedback_submission",
      entity_type: "feedback",
      entity_id: feedback.id,
      new_value: {
        submission_type,
        whatsapp_number,
        student_id: studentId,
      },
    });

    // 4. Respond to user immediately (non-blocking)
    res.status(201).json({
      success: true,
      data: feedback,
    });

    // 5. Queue AI processing asynchronously
    setImmediate(async () => {
      try {
        // Query system settings for AI analysis toggle
        const { data: aiSetting } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", "ai_analysis_enabled")
          .maybeSingle();

        const isAiEnabled = aiSetting ? aiSetting.value === true : true;

        if (!isAiEnabled) {
          logger.info(`Async AI Processing Bypassed: disabled in settings for feedback ${feedback.id}`);
          const { error: updateError } = await supabase
            .from("feedback")
            .update({
              summary: feedback.raw_text.substring(0, 120) + (feedback.raw_text.length > 120 ? "..." : ""),
              category: "General",
              sentiment: "Neutral",
              priority: "Medium",
              ai_processed: false,
              updated_at: new Date().toISOString(),
            })
            .eq("id", feedback.id);
          
          if (updateError) {
            logger.error(`Async AI Bypass update failed for feedback ${feedback.id}:`, updateError);
          }
          return;
        }

        logger.info(`Async AI Processing: Starting for feedback ${feedback.id}`);
        const aiResult = await analyzeFeedback(feedback.raw_text);

        // Update database with results
        const { error: updateError } = await supabase
          .from("feedback")
          .update({
            summary: aiResult.summary,
            category: aiResult.category,
            sentiment: aiResult.sentiment,
            priority: aiResult.priority,
            ai_processed: true,
            ai_processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", feedback.id);

        if (updateError) {
          logger.error(`Async AI Processing: Failed to update feedback ${feedback.id} in DB:`, updateError);
        } else {
          logger.info(`Async AI Processing: Successfully completed for feedback ${feedback.id}`);
        }
      } catch (err) {
        logger.error(`Async AI Processing: Error processing feedback ${feedback.id}:`, err);
      }
    });
  })
);

// All routes below require authentication
router.use(requireAuth);

/**
 * GET /feedback
 * Returns paginated, filtered list of feedback.
 */
router.get(
  "/",
  validate(FeedbackListQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const authedReq = req as AuthenticatedRequest;
    const {
      page,
      limit,
      status,
      category,
      sentiment,
      priority,
      submission_type,
      date_from,
      date_to,
      search,
      sort_by,
      sort_order,
    } = req.query as Record<string, string>;

    const offset = (parseInt(page ?? "1") - 1) * parseInt(limit ?? "20");
    let sortByField = sort_by ?? "created_at";
    if (sortByField === "ai_priority") {
      sortByField = "priority";
    }

    const selectFields = `
      id, submission_type, ${hasSubmitterType ? "submitter_type, " : ""}raw_text, summary, category,
      sentiment, priority, ai_processed, ai_processed_at, status,
      cluster_id, created_at, updated_at,
      is_anonymous, student_id, verification_status, verified_at,
      tracking_number, last_action_note, status_updated_at,
      feedback_scope, submitter_relationship,
      feedback_evidence(id, file_url, file_type),
      students(id, admission_no, student_name, class, section)
    `;

    let query = supabase
      .from("feedback")
      .select(selectFields, { count: "exact" })
      .order(sortByField, { ascending: sort_order === "asc" })
      .range(offset, offset + parseInt(limit ?? "20") - 1);

    // Filters
    if (status) query = query.eq("status", status);
    
    // Support multi-filter comma-separated lists
    if (category) {
      const categories = category.split(",").map(c => c.trim()).filter(Boolean);
      if (categories.length === 1) {
        query = query.eq("category", categories[0]);
      } else if (categories.length > 1) {
        query = query.in("category", categories);
      }
    }
    
    if (sentiment) {
      const sentiments = sentiment.split(",").map(s => s.trim()).filter(Boolean);
      if (sentiments.length === 1) {
        query = query.eq("sentiment", sentiments[0]);
      } else if (sentiments.length > 1) {
        query = query.in("sentiment", sentiments);
      }
    }
    
    if (priority) {
      const priorities = priority.split(",").map(p => p.trim()).filter(Boolean);
      if (priorities.length === 1) {
        query = query.eq("priority", priorities[0]);
      } else if (priorities.length > 1) {
        query = query.in("priority", priorities);
      }
    }
    
    if (submission_type) query = query.eq("submission_type", submission_type);

    // Filter by submitter_type if provided and schema supports it
    const submitter_type_filter = (req.query as Record<string, string>).submitter_type;
    if (submitter_type_filter && hasSubmitterType) query = query.eq("submitter_type", submitter_type_filter);

    if (date_from) query = query.gte("created_at", date_from);
    if (date_to) query = query.lte("created_at", date_to);
    
    if (search) {
      // 1. Query students matching search on name or admission number
      const { data: matchedStudents } = await supabase
        .from("students")
        .select("id")
        .or(`student_name.ilike.%${search}%,admission_no.ilike.%${search}%`);
      
      const studentIds = (matchedStudents ?? []).map(s => s.id);
      
      // 2. Query feedback matching raw_text, summary, category, tracking_number, or matching student IDs
      let searchConditions = `raw_text.ilike.%${search}%,summary.ilike.%${search}%,category.ilike.%${search}%,tracking_number.ilike.%${search}%`;
      if (studentIds.length > 0) {
        searchConditions += `,student_id.in.(${studentIds.join(",")})`;
      }
      query = query.or(searchConditions);
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error("Feedback list error:", error);
      throw error;
    }

    // Strip identity details according to anonymity constraints
    const sanitized = (data ?? []).map((item: any) => {
      const isAnon = item.is_anonymous || item.submission_type === FeedbackType.ANONYMOUS;
      const isPrincipalOnlyHidden =
        item.submission_type === FeedbackType.PRINCIPAL_ONLY &&
        authedReq.adminRole !== "principal";

      let processedItem = { ...item };
      if (!hasSubmitterType) {
        processedItem.submitter_type = FeedbackSubmitterType.UNKNOWN;
      }

      if (isAnon || isPrincipalOnlyHidden) {
        return {
          ...processedItem,
          submitter_name: null,
          submitter_phone: null,
          submitter_relationship: null,
          student_id: null,
          students: null,
          student: null,
        };
      }
      
      return {
        ...processedItem,
        student: item.students,
      };
    });

    const total = count ?? 0;
    const totalPages = Math.ceil(total / parseInt(limit ?? "20"));
    const currentPage = parseInt(page ?? "1");

    res.json({
      success: true,
      data: sanitized,
      pagination: {
        page: currentPage,
        limit: parseInt(limit ?? "20"),
        total,
        total_pages: totalPages,
        has_next: currentPage < totalPages,
        has_prev: currentPage > 1,
      },
    });
  })
);

/**
 * GET /feedback/:id
 * Returns a single feedback item with full details.
 */
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const authedReq = req as AuthenticatedRequest;
    const { id } = req.params;

    const { data, error } = await supabase
      .from("feedback")
      .select(
        `
        *,
        feedback_evidence(*),
        feedback_comments(*, admins(id, name, role)),
        issue_clusters(id, title, report_count),
        students(*),
        feedback_timeline(*)
      `
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Feedback not found" },
      });
      return;
    }

    // Strip identity details according to anonymity constraints
    const isAnon = data.is_anonymous || data.submission_type === FeedbackType.ANONYMOUS;
    const isPrincipalOnlyHidden =
      data.submission_type === FeedbackType.PRINCIPAL_ONLY &&
      authedReq.adminRole !== "principal";

    if (!hasSubmitterType) {
      data.submitter_type = FeedbackSubmitterType.UNKNOWN;
    }

    if (isAnon || isPrincipalOnlyHidden) {
      data.submitter_name = null;
      data.submitter_phone = null;
      data.submitter_relationship = null;
      data.student_id = null;
      data.students = null;
      data.student = null;
    } else {
      data.student = data.students;

      // Dynamic relationship lookup fallback if not stored
      if (!data.submitter_relationship && data.submitter_phone) {
        const last10 = data.submitter_phone.length >= 10 ? data.submitter_phone.slice(-10) : data.submitter_phone;
        let contactQuery = supabase
          .from("student_contacts")
          .select("relationship")
          .like("phone_number", `%${last10}`);

        if (data.student_id) {
          contactQuery = contactQuery.eq("student_id", data.student_id);
        }

        const { data: contacts } = await contactQuery;
        if (contacts && contacts.length > 0) {
          data.submitter_relationship = contacts[0].relationship;
        }
      }

      if (data.student && !hasParentFields) {
        // Expose default null parent fields if schema doesn't have them yet
        data.student.parent_name = null;
        data.student.parent_phone = null;
        data.student.guardian_name = null;
        data.student.guardian_phone = null;
      }
    }

    // Sort timeline chronologically (earliest to latest)
    if (data.feedback_timeline) {
      data.timeline = data.feedback_timeline.sort((a: any, b: any) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    } else {
      data.timeline = [];
    }

    res.json({ success: true, data });
  })
);

/**
 * PATCH /feedback/:id/status
 * Updates the status of a feedback item and logs the action.
 */
router.patch(
  "/:id/status",
  validate(UpdateFeedbackStatusSchema),
  asyncHandler(async (req, res) => {
    const authedReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { status, last_action_note } = req.body as { status: string; last_action_note?: string };

    // Get current status for audit log
    const { data: current } = await supabase
      .from("feedback")
      .select("status")
      .eq("id", id)
      .single();

    const { data, error } = await supabase
      .from("feedback")
      .update({
        status,
        last_action_note: last_action_note || null,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select("id, status, last_action_note, status_updated_at, updated_at")
      .single();

    if (error || !data) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Feedback not found" },
      });
      return;
    }

    // Audit log
    await supabase.from("audit_logs").insert({
      admin_id: authedReq.adminId,
      action: "status_change",
      entity_type: "feedback",
      entity_id: id,
      old_value: { status: current?.status },
      new_value: { status, last_action_note },
    });

    logger.info(`Feedback ${id} status: ${current?.status} → ${status} (${last_action_note || "No note"})`);
    res.json({ success: true, data });
  })
);

/**
 * POST /feedback/:id/reprocess
 * Reprocesses the feedback item with AI and logs the action.
 */
router.post(
  "/:id/reprocess",
  asyncHandler(async (req, res) => {
    const authedReq = req as AuthenticatedRequest;
    const { id } = req.params;

    // 1. Fetch raw text of feedback
    const { data: feedback, error: fetchError } = await supabase
      .from("feedback")
      .select("raw_text, category, priority, sentiment, summary")
      .eq("id", id)
      .single();

    if (fetchError || !feedback) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Feedback not found" },
      });
      return;
    }

    // 2. Call AI Service
    const aiResult = await analyzeFeedback(feedback.raw_text);

    // 3. Update database
    const { data: updated, error: updateError } = await supabase
      .from("feedback")
      .update({
        summary: aiResult.summary,
        category: aiResult.category,
        sentiment: aiResult.sentiment,
        priority: aiResult.priority,
        ai_processed: true,
        ai_processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(`
        *,
        feedback_evidence(*),
        feedback_comments(*, admins(id, name, role)),
        issue_clusters(id, title, report_count),
        students(*)
      `)
      .single();

    if (updateError || !updated) {
      logger.error("Reprocess database update failed:", updateError);
      throw updateError;
    }

    // 4. Strip identity details according to anonymity constraints
    const isAnon = updated.is_anonymous || updated.submission_type === FeedbackType.ANONYMOUS;
    const isPrincipalOnlyHidden =
      updated.submission_type === FeedbackType.PRINCIPAL_ONLY &&
      authedReq.adminRole !== "principal";

    if (isAnon || isPrincipalOnlyHidden) {
      updated.submitter_name = null;
      updated.submitter_phone = null;
      updated.student_id = null;
      updated.students = null;
      updated.student = null;
    } else {
      updated.student = updated.students;
    }

    // 5. Create Audit Log
    await supabase.from("audit_logs").insert({
      admin_id: authedReq.adminId,
      action: "ai_reprocessed",
      entity_type: "feedback",
      entity_id: id,
      old_value: {
        summary: feedback.summary,
        category: feedback.category,
        sentiment: feedback.sentiment,
        priority: feedback.priority,
      },
      new_value: {
        summary: aiResult.summary,
        category: aiResult.category,
        sentiment: aiResult.sentiment,
        priority: aiResult.priority,
      },
    });

    logger.info(`Feedback ${id} reprocessed with AI by admin ${authedReq.adminId}`);
    res.json({ success: true, data: updated });
  })
);

/**
 * DELETE /feedback/:id
 * Deletes a specific feedback item. Only accessible by Principal.
 */
router.delete(
  "/:id",
  requirePrincipal,
  asyncHandler(async (req, res) => {
    const authedReq = req as AuthenticatedRequest;
    const { id } = req.params;

    // 1. Fetch info for audit log
    const { data: feedback, error: fetchError } = await supabase
      .from("feedback")
      .select("tracking_number, raw_text")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !feedback) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Feedback not found" },
      });
      return;
    }

    // 2. Delete the feedback
    const { error: deleteError } = await supabase
      .from("feedback")
      .delete()
      .eq("id", id);

    if (deleteError) {
      logger.error(`Failed to delete feedback ${id}:`, deleteError);
      res.status(500).json({
        success: false,
        error: { code: "DB_ERROR", message: "Failed to delete feedback record" },
      });
      return;
    }

    // 3. Create Audit Log
    await supabase.from("audit_logs").insert({
      admin_id: authedReq.adminId,
      action: "feedback_delete",
      entity_type: "feedback",
      entity_id: id,
      old_value: {
        tracking_number: feedback.tracking_number,
        raw_text: feedback.raw_text,
      },
    });

    logger.info(`Feedback ${id} (${feedback.tracking_number}) deleted by principal ${authedReq.adminId}`);
    res.json({ success: true, message: "Feedback deleted successfully" });
  })
);

/**
 * DELETE /feedback
 * Deletes all feedback items. Only accessible by Principal.
 */
router.delete(
  "/",
  requirePrincipal,
  asyncHandler(async (req, res) => {
    const authedReq = req as AuthenticatedRequest;

    // 1. Get count of feedback being deleted
    const { count, error: countError } = await supabase
      .from("feedback")
      .select("id", { count: "exact", head: true });

    if (countError) {
      logger.error("Failed to query feedback count for bulk delete:", countError);
      res.status(500).json({
        success: false,
        error: { code: "DB_ERROR", message: "Failed to count feedback records" },
      });
      return;
    }

    if (!count) {
      res.json({ success: true, message: "No feedback items to delete", count: 0 });
      return;
    }

    // 2. Delete all feedback
    const { error: deleteError } = await supabase
      .from("feedback")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Deletes all records

    if (deleteError) {
      logger.error("Failed to delete all feedback items:", deleteError);
      res.status(500).json({
        success: false,
        error: { code: "DB_ERROR", message: "Failed to delete all feedback records" },
      });
      return;
    }

    // 3. Create Audit Log
    await supabase.from("audit_logs").insert({
      admin_id: authedReq.adminId,
      action: "feedback_delete_all",
      entity_type: "feedback",
      new_value: { count_deleted: count },
    });

    logger.warn(`All feedback records (${count}) deleted by principal ${authedReq.adminId}`);
    res.json({ success: true, message: "All feedback items deleted successfully", count });
  })
);

export default router;
