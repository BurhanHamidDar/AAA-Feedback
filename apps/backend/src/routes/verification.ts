import { Router } from "express";
import { validate } from "../middleware/validate";
import { supabase } from "../config/supabase";
import { logger } from "../utils/logger";
import { asyncHandler } from "../utils/asyncHandler";
import { VerifyAdmissionSchema } from "@aaa-feedback/shared";
import { verificationRateLimit } from "../middleware/rateLimit";

const router: Router = Router();

/**
 * POST /api/verification/verify
 * Public endpoint to verify student admission number.
 * Features rate-limiting: max 5 failed attempts per day per WhatsApp number.
 */
router.post(
  "/verify",
  verificationRateLimit,
  validate(VerifyAdmissionSchema),
  asyncHandler(async (req, res) => {
    const { whatsapp_number, admission_no } = req.body;

    // 1. Fetch current session if exists to check rate limiting / block status
    const { data: session, error: sessionError } = await supabase
      .from("whatsapp_sessions")
      .select("*")
      .eq("whatsapp_number", whatsapp_number)
      .maybeSingle();

    if (sessionError) {
      logger.error(`Verification: Error looking up session for ${whatsapp_number}:`, sessionError);
      throw sessionError;
    }

    const now = new Date();

    // Check if blocked
    if (session && session.blocked_until) {
      const blockedUntilDate = new Date(session.blocked_until);
      if (blockedUntilDate > now) {
        logger.warn(`Verification Blocked: Phone ${whatsapp_number} attempted verification but is blocked until ${session.blocked_until}`);
        res.status(429).json({
          success: false,
          error: {
            code: "TOO_MANY_ATTEMPTS",
            message: `Too many failed attempts. Verification is blocked for this number until ${blockedUntilDate.toLocaleTimeString()}.`,
          },
        });
        return;
      } else {
        // Block duration has expired, reset attempts
        await supabase
          .from("whatsapp_sessions")
          .update({
            failed_attempts: 0,
            blocked_until: null,
            updated_at: now.toISOString(),
          })
          .eq("whatsapp_number", whatsapp_number);
      }
    }

    // 2. Query student registry
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("*")
      .eq("admission_no", admission_no)
      .maybeSingle();

    if (studentError) {
      logger.error(`Verification: Error looking up student with admission_no ${admission_no}:`, studentError);
      throw studentError;
    }

    // 3. Handle Invalid Admission Number
    if (!student) {
      const failedAttempts = (session ? session.failed_attempts : 0) + 1;
      let blockedUntil: string | null = null;

      if (failedAttempts >= 5) {
        // Block for 24 hours
        const blockDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        blockedUntil = blockDate.toISOString();
        logger.warn(`Verification Rate Limit: Phone ${whatsapp_number} blocked until ${blockedUntil} after 5 failed attempts.`);
      }

      // Save/increment failed attempts in sessions table
      if (session) {
        await supabase
          .from("whatsapp_sessions")
          .update({
            failed_attempts: failedAttempts,
            last_failed_at: now.toISOString(),
            blocked_until: blockedUntil,
            updated_at: now.toISOString(),
          })
          .eq("whatsapp_number", whatsapp_number);
      } else {
        await supabase
          .from("whatsapp_sessions")
          .insert({
            whatsapp_number,
            failed_attempts: failedAttempts,
            last_failed_at: now.toISOString(),
            blocked_until: blockedUntil,
          });
      }

      // Log verification failure to audit_logs
      await supabase.from("audit_logs").insert({
        action: "verification_failure",
        entity_type: "admin",
        old_value: { whatsapp_number, admission_no, failed_attempts: failedAttempts },
        new_value: { blocked: !!blockedUntil },
      });

      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_ADMISSION_NUMBER",
          message: "Invalid Admission Number. Please check and try again.",
        },
      });
      return;
    }

    // 4. Handle Valid Admission Number (Verification Success)
    if (session) {
      await supabase
        .from("whatsapp_sessions")
        .update({
          student_id: student.id,
          verified_at: now.toISOString(),
          failed_attempts: 0,
          blocked_until: null,
          updated_at: now.toISOString(),
        })
        .eq("whatsapp_number", whatsapp_number);
    } else {
      await supabase
        .from("whatsapp_sessions")
        .insert({
          whatsapp_number,
          student_id: student.id,
          verified_at: now.toISOString(),
          failed_attempts: 0,
          blocked_until: null,
        });
    }

    // Log verification success to audit_logs
    await supabase.from("audit_logs").insert({
      action: "verification_success",
      entity_type: "feedback",
      entity_id: student.id,
      new_value: { whatsapp_number, admission_no, student_name: student.student_name },
    });

    logger.info(`Verification Succeeded: Phone ${whatsapp_number} verified for student ${student.student_name} (${admission_no})`);

    res.status(200).json({
      success: true,
      message: "Admission Number verified successfully.",
      data: {
        student_name: student.student_name,
        class: student.class,
        section: student.section,
      },
    });
  })
);

export default router;
