import { messagingService } from "../messaging/whatsapp";
import { supabase } from "../../config/supabase";
import { logger } from "../../utils/logger";
import { analyzeFeedback } from "../ai/analyzeFeedback";
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from "../../config/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { hasSubmitterType, hasSystemSettingsTable } from "../../utils/schema";
import { getStudentContactsByPhone } from "../../utils/phone";

export type BotStep =
  | "idle"
  | "parent_menu"
  | "unregistered_menu"
  | "parent_student_selection"
  | "feedback_privacy"
  | "awaiting_admission_no"
  | "awaiting_feedback_text"
  | "awaiting_evidence"
  | "awaiting_tracking_no";

export interface SessionState {
  step: BotStep;
  contacts?: any[]; // Cached matched contact records
  studentId?: string | null; // Cached verified student record id
  submitterType?: "Student" | "Parent" | "Guardian" | "Unknown";
  relationship?: string | null;
  feedbackScope?: "student_specific" | "multiple_students" | "general_school";
  submissionType?: "anonymous" | "principal_only" | "contact_me";
  feedbackText?: string;
  evidence: Array<{ data: string; mimetype: string; filename?: string }>;
  lastMessageAt: Date;
}

// In-memory sessions
const sessions = new Map<string, SessionState>();

// Duplicate submission protection cache (Map of phone number -> last submission text and timestamp)
const lastSubmissions = new Map<string, { text: string; timestamp: Date }>();

// R2 Helper: Uploads buffer to Cloudflare R2
async function uploadMediaToR2(feedbackId: string, mimetype: string, base64Data: string, filename?: string): Promise<{ url: string; size: number }> {
  const buffer = Buffer.from(base64Data, "base64");
  const ext = filename?.split(".").pop() || mimetype.split("/")[1]?.split(";")[0] || "jpg";
  const key = `evidence/${feedbackId}/${randomUUID()}.${ext}`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    })
  );

  return {
    url: `${R2_PUBLIC_URL}/${key}`,
    size: buffer.length,
  };
}

// Check if feedback collection is enabled
async function isFeedbackCollectionEnabled(): Promise<boolean> {
  if (!hasSystemSettingsTable) {
    return true; // Default fallback when table is missing
  }
  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "feedback_collection_enabled")
      .maybeSingle();

    if (error || !data) {
      return true; // Default to true if table is empty or missing
    }

    return data.value === true;
  } catch (err) {
    logger.error("Error checking system settings:", err);
    return true;
  }
}



// Check if maintenance mode is enabled
async function isMaintenanceModeEnabled(): Promise<boolean> {
  if (!hasSystemSettingsTable) {
    return false; // Default fallback when table is missing
  }
  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "maintenance_mode")
      .maybeSingle();

    if (error || !data) {
      return false; // Default to false if table is empty or missing
    }

    return data.value === true;
  } catch (err) {
    logger.error("Error checking maintenance settings:", err);
    return false;
  }
}



// Student verification helper matching backend route rules
async function verifyAdmissionNumber(phone: string, admissionNo: string): Promise<{ success: boolean; message: string; studentId?: string; studentName?: string }> {
  // 1. Fetch current session if exists to check rate limiting / block status
  const { data: dbSession, error: sessionError } = await supabase
    .from("whatsapp_sessions")
    .select("*")
    .eq("whatsapp_number", phone)
    .maybeSingle();

  if (sessionError) {
    logger.error(`Verification: Error looking up session for ${phone}:`, sessionError);
    return { success: false, message: "An error occurred while checking verification status. Please try again." };
  }

  const now = new Date();

  // Check if blocked
  if (dbSession && dbSession.blocked_until) {
    const blockedUntilDate = new Date(dbSession.blocked_until);
    if (blockedUntilDate > now) {
      logger.warn(`Verification Blocked: Phone ${phone} blocked until ${dbSession.blocked_until}`);
      return {
        success: false,
        message: `Too many failed attempts. Verification is blocked for this number until ${blockedUntilDate.toLocaleTimeString()}.`,
      };
    } else {
      // Block duration expired, reset attempts
      await supabase
        .from("whatsapp_sessions")
        .update({
          failed_attempts: 0,
          blocked_until: null,
          updated_at: now.toISOString(),
        })
        .eq("whatsapp_number", phone);
    }
  }

  // 2. Query student registry
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("*")
    .eq("admission_no", admissionNo)
    .maybeSingle();

  if (studentError) {
    logger.error(`Verification: Error looking up student with admission_no ${admissionNo}:`, studentError);
    return { success: false, message: "An error occurred while querying the student registry." };
  }

  // 3. Handle Invalid Admission Number
  if (!student) {
    const failedAttempts = (dbSession ? dbSession.failed_attempts : 0) + 1;
    let blockedUntil: string | null = null;

    if (failedAttempts >= 5) {
      // Block for 24 hours
      const blockDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      blockedUntil = blockDate.toISOString();
      logger.warn(`Verification Rate Limit: Phone ${phone} blocked until ${blockedUntil} after 5 failed attempts.`);
    }

    // Save/increment failed attempts in sessions table
    if (dbSession) {
      await supabase
        .from("whatsapp_sessions")
        .update({
          failed_attempts: failedAttempts,
          last_failed_at: now.toISOString(),
          blocked_until: blockedUntil,
          updated_at: now.toISOString(),
        })
        .eq("whatsapp_number", phone);
    } else {
      await supabase
        .from("whatsapp_sessions")
        .insert({
          whatsapp_number: phone,
          failed_attempts: failedAttempts,
          last_failed_at: now.toISOString(),
          blocked_until: blockedUntil,
        });
    }

    // Log verification failure to audit_logs
    await supabase.from("audit_logs").insert({
      action: "verification_failure",
      entity_type: "admin",
      old_value: { whatsapp_number: phone, admission_no: admissionNo, failed_attempts: failedAttempts },
      new_value: { blocked: !!blockedUntil },
    });

    if (blockedUntil) {
      return {
        success: false,
        message: "❌ Too many failed verification attempts. This number has been blocked for 24 hours.",
      };
    }
    return {
      success: false,
      message: `❌ Invalid Admission Number. Please check and try again. (Attempts: ${failedAttempts}/5)`,
    };
  }

  // 4. Handle Valid Admission Number (Verification Success)
  if (dbSession) {
    await supabase
      .from("whatsapp_sessions")
      .update({
        student_id: student.id,
        verified_at: now.toISOString(),
        failed_attempts: 0,
        blocked_until: null,
        updated_at: now.toISOString(),
      })
      .eq("whatsapp_number", phone);
  } else {
    await supabase
      .from("whatsapp_sessions")
      .insert({
        whatsapp_number: phone,
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
    new_value: { whatsapp_number: phone, admission_no: admissionNo, student_name: student.student_name },
  });

  logger.info(`Verification Succeeded: Phone ${phone} verified for student ${student.student_name} (${admissionNo})`);
  return {
    success: true,
    message: `✅ Verified successfully as: ${student.student_name}`,
    studentId: student.id,
    studentName: student.student_name,
  };
}

export function initializeFeedbackBot() {
  messagingService.onMessageReceived(async (msg) => {
    // rawPhone = the original JID (e.g. "919876543210@c.us" or "236622683627630@lid")
    // Used ONLY for sending replies — WhatsApp routes both @c.us and @lid correctly.
    const rawPhone = msg.from;

    // phone = the real phone number digits (e.g. "919876543210")
    // Used for session keys and database lookups.
    // For @lid senders whose real phone can't be resolved, this falls back to the
    // LID user-part; those users will reach the unregistered-menu flow.
    const phone = msg.phoneNumber;

    const text = msg.body.trim();

    logger.info(`FeedbackBot processing message from ${phone} (JID: ${rawPhone}): "${text}"`);

    // 1. Check Maintenance Mode
    const isMaintenance = await isMaintenanceModeEnabled();
    if (isMaintenance) {
      logger.info(`WhatsApp bot: Ignored message from ${phone} because System Maintenance Mode is active.`);
      await messagingService.sendMessage(
        rawPhone,
        `⚠️ System Maintenance\n\n` +
        `This system is under maintenance. Please try again later.`
      );
      return;
    }

    // Fetch or create in-memory session
    let session = sessions.get(phone);
    if (!session) {
      session = { step: "idle", evidence: [], lastMessageAt: new Date() };
      sessions.set(phone, session);
    } else {
      // 15-minute inactivity session timeout check
      const timeoutMs = 15 * 60 * 1000;
      if (Date.now() - new Date(session.lastMessageAt).getTime() > timeoutMs) {
        logger.info(`Session timed out for ${phone}. Resetting to idle.`);
        session.step = "idle";
        session.evidence = [];
      }
    }
    session.lastMessageAt = new Date();

    // Universal command to return to main menu
    if (text.toLowerCase() === "menu") {
      session.step = "idle";
      session.evidence = [];
    }

    try {
      // ──────────────────────────────────────────────
      // State Machine
      // ──────────────────────────────────────────────
      switch (session.step) {
        case "idle": {
          // Parent-First Verification Flow:
          // 1. Normalize and check if the incoming phone number is registered in the database.
          //    We look up matches in the students table using both parent_phone and guardian_phone.
          const contacts = await getStudentContactsByPhone(phone);
          if (contacts.length > 0) {
            // CASE 1: Registered parent number found.
            // Cache the student-parent associations.
            session.contacts = contacts;
            session.step = "parent_menu";
            const parentName = contacts[0].contact_name || "Parent/Guardian";
            const welcomeMsg =
              `Welcome, ${parentName}!\n` +
              `Ayesha Ali Academy — AAA Feedback\n` +
              `──────────────────────\n` +
              `We have identified your registered mobile number.\n\n` +
              `Please choose:\n` +
              `1. Submit Feedback\n` +
              `2. Track Complaint\n` +
              `3. Help & Information`;
            await messagingService.sendMessage(rawPhone, welcomeMsg);
          } else {
            // CASE 2: Parent number NOT found.
            // Move to the unregistered flow where they can verify their student Admission Number.
            session.step = "unregistered_menu";
            const welcomeMsg =
              `Welcome to AAA Feedback\n` +
              `Ayesha Ali Academy Portal\n` +
              `──────────────────────\n` +
              `This mobile number is not registered as a parent/guardian number.\n\n` +
              `Please choose:\n` +
              `1. Student Feedback\n` +
              `2. Help & Information`;
            await messagingService.sendMessage(rawPhone, welcomeMsg);
          }
          break;
        }

        case "parent_menu": {
          if (text === "1") {
            // Check if feedback collection is disabled
            const enabled = await isFeedbackCollectionEnabled();
            if (!enabled) {
              await messagingService.sendMessage(
                rawPhone,
                `AAA Feedback is currently unavailable.\n\nPlease contact the school administration.`
              );
              return;
            }

            const contacts = session.contacts || [];
            if (contacts.length === 0) {
              const freshContacts = await getStudentContactsByPhone(phone);
              session.contacts = freshContacts;
              if (freshContacts.length === 0) {
                session.step = "unregistered_menu";
                await messagingService.sendMessage(
                  rawPhone,
                  `This mobile number is not registered as a parent/guardian number.\n\n` +
                  `Please choose:\n` +
                  `1. Student Feedback\n` +
                  `2. Help & Information`
                );
                return;
              }
            }

            // Student selection menu
            const kidsList = session.contacts!.map((c: any, index: number) => {
              const student = c.student;
              return `${index + 1}. ${student.student_name} (${student.class}${student.section ? ` ${student.section}` : ""})`;
            });

            let selectionMsg = `Please choose:\n\n` + kidsList.join("\n") + `\n`;
            const generalIndex = session.contacts!.length + 1;
            selectionMsg += `${generalIndex}. General School Feedback\n`;

            if (session.contacts!.length > 1) {
              const multipleIndex = session.contacts!.length + 2;
              selectionMsg += `${multipleIndex}. Feedback Related To Multiple Children\n`;
            }

            selectionMsg += `\nReply with the option number.`;
            await messagingService.sendMessage(rawPhone, selectionMsg);
            session.step = "parent_student_selection";

          } else if (text === "2") {
            await messagingService.sendMessage(
              rawPhone,
              `Please enter your Feedback Reference Number (e.g., FB-2026-000125):`
            );
            session.step = "awaiting_tracking_no";
          } else if (text === "3") {
            const helpMsg =
              `❓ AAA Feedback Help & Info\n` +
              `──────────────────────\n` +
              `• Registered Number: Your WhatsApp phone number is recognized in our parent/guardian directory.\n\n` +
              `• How to Submit: Select Option 1. Choose the child or general scope, choose privacy level, and type your feedback description.\n\n` +
              `• Anonymity: Choosing "Anonymous" strictly prevents your name and number from being visible on the Principal's dashboard.\n\n` +
              `• Tracking: Choosing Option 2 and entering your reference number lets you view resolutions.\n\n` +
              `Reply with "menu" to return.`;
            await messagingService.sendMessage(rawPhone, helpMsg);
          } else {
            await messagingService.sendMessage(rawPhone, `❌ Invalid selection. Please reply with 1, 2, or 3.`);
          }
          break;
        }

        case "unregistered_menu": {
          if (text === "1") {
            // Check if feedback collection is disabled
            const enabled = await isFeedbackCollectionEnabled();
            if (!enabled) {
              await messagingService.sendMessage(
                rawPhone,
                `AAA Feedback is currently unavailable.\n\nPlease contact the school administration.`
              );
              return;
            }

            await messagingService.sendMessage(
              rawPhone,
              `Please enter your student Admission Number to verify your record (e.g., AAA19/GI/0270):`
            );
            session.step = "awaiting_admission_no";
          } else if (text === "2") {
            const helpMsg =
              `❓ AAA Feedback Help & Info\n` +
              `──────────────────────\n` +
              `• Student Verification: Verify using your child's or your student Admission Number (e.g., AAA19/GI/0270) to proceed.\n\n` +
              `• Submission: Once verified, choose a privacy level and send your feedback.\n\n` +
              `• Tracking: Select "Track Feedback" from the main menu and enter your tracking code (e.g. FB-2026-000125).\n\n` +
              `Reply with "menu" to return.`;
            await messagingService.sendMessage(rawPhone, helpMsg);
          } else {
            await messagingService.sendMessage(rawPhone, `❌ Invalid selection. Please reply with 1 or 2.`);
          }
          break;
        }

        case "parent_student_selection": {
          const choice = parseInt(text);
          const contacts = session.contacts || [];
          const totalContacts = contacts.length;

          if (isNaN(choice) || choice < 1 || choice > totalContacts + 2) {
            await messagingService.sendMessage(rawPhone, `❌ Invalid option. Please reply with a valid number from the menu.`);
            return;
          }

          if (choice <= totalContacts) {
            // Student selected
            const selected = contacts[choice - 1];
            session.studentId = selected.student_id;
            session.submitterType = selected.relationship === "Guardian" ? "Guardian" : "Parent";
            session.relationship = selected.relationship;
            session.feedbackScope = "student_specific";
            (session as any).submitterName = selected.contact_name;

            await messagingService.sendMessage(
              rawPhone,
              `✅ Selected Child: ${selected.student.student_name} (${selected.student.class}${selected.student.section ? ` ${selected.student.section}` : ""})`
            );
          } else if (choice === totalContacts + 1) {
            // General School Feedback
            session.studentId = null;
            session.submitterType = "Parent";
            session.relationship = contacts[0]?.relationship || "Parent";
            session.feedbackScope = "general_school";
            (session as any).submitterName = contacts[0]?.contact_name || "Parent";

            await messagingService.sendMessage(rawPhone, `✅ Selected: General School Feedback`);
          } else if (choice === totalContacts + 2 && totalContacts > 1) {
            // Multiple kids feedback
            session.studentId = null;
            session.submitterType = "Parent";
            session.relationship = contacts[0]?.relationship || "Parent";
            session.feedbackScope = "multiple_students";
            (session as any).submitterName = contacts[0]?.contact_name || "Parent";

            await messagingService.sendMessage(rawPhone, `✅ Selected: Feedback Related To Multiple Children`);
          } else {
            await messagingService.sendMessage(rawPhone, `❌ Invalid option. Please reply with a valid number from the menu.`);
            return;
          }

          const privacyMenu =
            `Please select the type of feedback you want to submit:\n\n` +
            `1. 🔒 Anonymous (Identity hidden from Principal on dashboard)\n` +
            `2. 👤 Principal Only (Only visible to Principal)\n` +
            `3. 💬 Contact Me (Visible to Principal & Admin)`;
          await messagingService.sendMessage(rawPhone, privacyMenu);
          session.step = "feedback_privacy";
          break;
        }

        case "awaiting_admission_no": {
          await messagingService.sendMessage(rawPhone, `⏳ Verifying admission number, please wait…`);
          const verifyResult = await verifyAdmissionNumber(phone, text);

          if (verifyResult.success && verifyResult.studentId) {
            session.studentId = verifyResult.studentId;
            session.submitterType = "Student";
            session.relationship = null;
            session.feedbackScope = "student_specific";
            (session as any).submitterName = verifyResult.studentName || "Student";

            const privacyMenu =
              `✅ Verified successfully as: ${verifyResult.studentName || "Student"}\n\n` +
              `Please select the type of feedback you want to submit:\n\n` +
              `1. 🔒 Anonymous (Identity hidden from Principal on dashboard)\n` +
              `2. 👤 Principal Only (Only visible to Principal)\n` +
              `3. 💬 Contact Me (Visible to Principal & Admin)`;

            await messagingService.sendMessage(rawPhone, privacyMenu);
            session.step = "feedback_privacy";
          } else {
            await messagingService.sendMessage(rawPhone, verifyResult.message);
          }
          break;
        }

        case "feedback_privacy": {
          if (text === "1" || text === "2" || text === "3") {
            const types: Record<string, "anonymous" | "principal_only" | "contact_me"> = {
              "1": "anonymous",
              "2": "principal_only",
              "3": "contact_me",
            };
            session.submissionType = types[text];
            await messagingService.sendMessage(
              rawPhone,
              `Please type and send your feedback description:\n(You can describe your concern, suggest improvements, or report issues)`
            );
            session.step = "awaiting_feedback_text";
          } else {
            await messagingService.sendMessage(rawPhone, `❌ Invalid option. Please reply with 1, 2, or 3.`);
          }
          break;
        }

        case "awaiting_feedback_text": {
          // Duplicate-feedback protection
          const lastSub = lastSubmissions.get(phone);
          const duplicateIntervalMs = 5 * 60 * 1000; // 5 minutes
          if (lastSub && lastSub.text === text && (Date.now() - lastSub.timestamp.getTime()) < duplicateIntervalMs) {
            await messagingService.sendMessage(
              rawPhone,
              `⚠️ Duplicate Protection: It looks like you've already submitted this feedback recently. We are processing your previous submission.\n\nReply with "menu" to return.`
            );
            session.step = "idle";
            session.evidence = [];
            return;
          }

          session.feedbackText = text;
          await messagingService.sendMessage(
            rawPhone,
            `📁 Optional: You can attach evidence (photos/screenshots) now.\n\nIf you do not have any evidence files, reply with "done" to submit your feedback.`
          );
          session.step = "awaiting_evidence";
          break;
        }

        case "awaiting_evidence": {
          if (msg.hasMedia && msg.downloadMedia) {
            try {
              const media = await msg.downloadMedia();
              session.evidence.push({
                data: media.data,
                mimetype: media.mimetype,
                filename: media.filename,
              });
              await messagingService.sendMessage(
                rawPhone,
                `✅ Evidence received successfully!\n\nYou can upload another image, or reply with "done" to complete and submit your feedback.`
              );
            } catch (err) {
              logger.error("Error receiving media attachment:", err);
              await messagingService.sendMessage(
                rawPhone,
                `❌ Failed to receive the evidence file. Please try uploading again or reply with "done" to skip.`
              );
            }
            return;
          }

          if (text.toLowerCase() === "done" || text.toLowerCase() === "no" || text.toLowerCase() === "submit") {
            if (!session.feedbackText || !session.submissionType) {
              await messagingService.sendMessage(rawPhone, `❌ Error processing submission. Session timed out. Please try again by replying with "menu".`);
              session.step = "idle";
              session.evidence = [];
              return;
            }

            await messagingService.sendMessage(rawPhone, `⏳ Submitting your feedback, please wait…`);

            const isAnonymous = session.submissionType === "anonymous";
            const feedbackId = randomUUID();

            // 1. Upload evidence attachments to Cloudflare R2
            const uploadedFiles: Array<{ url: string; size: number }> = [];
            for (const file of session.evidence) {
              try {
                const upload = await uploadMediaToR2(feedbackId, file.mimetype, file.data, file.filename);
                uploadedFiles.push(upload);
              } catch (err) {
                logger.error("Error uploading media file to R2 during WhatsApp bot submission:", err);
              }
            }

            // 2. Insert feedback record into Supabase (preserving references internal DB)
            const insertPayload: Record<string, any> = {
              id: feedbackId,
              submission_type: session.submissionType,
              raw_text: session.feedbackText,
              submitter_name: (session as any).submitterName || null,
              submitter_phone: phone,
              student_id: session.studentId || null,
              is_anonymous: isAnonymous,
              verification_status: "verified",
              verified_at: new Date().toISOString(),
              whatsapp_message_id: `wa_${randomUUID()}`,
              feedback_scope: session.feedbackScope || "student_specific",
              submitter_relationship: session.relationship || null,
            };

            if (hasSubmitterType) {
              insertPayload.submitter_type = session.submitterType ?? "Unknown";
            }

            const { data: feedbackData, error: insertError } = await supabase
              .from("feedback")
              .insert(insertPayload)
              .select("id, tracking_number")
              .single();

            if (insertError || !feedbackData) {
              logger.error("Error inserting feedback via WhatsApp bot:", insertError);
              await messagingService.sendMessage(rawPhone, `❌ Failed to save feedback due to a database error. Please try again later.`);
              return;
            }

            // 3. Save uploaded evidence file urls in the database
            if (uploadedFiles.length > 0) {
              const { error: evidenceError } = await supabase.from("feedback_evidence").insert(
                uploadedFiles.map((f) => ({
                  feedback_id: feedbackId,
                  file_url: f.url,
                  file_type: "image",
                  file_size: f.size,
                }))
              );
              if (evidenceError) {
                logger.error("Failed to insert evidence records in DB:", evidenceError);
              }
            }

            // 4. Log feedback submission in audit_logs
            await supabase.from("audit_logs").insert({
              action: isAnonymous ? "anonymous_submission" : "feedback_submission",
              entity_type: "feedback",
              entity_id: feedbackId,
            });

            // 5. Trigger async AI analysis
            const triggerAiAnalysis = async () => {
              try {
                let isAiEnabled = true;

                if (hasSystemSettingsTable) {
                  const { data: aiSetting } = await supabase
                    .from("system_settings")
                    .select("value")
                    .eq("key", "ai_analysis_enabled")
                    .maybeSingle();

                  isAiEnabled = aiSetting ? aiSetting.value === true : true;
                }
                
                const feedbackText = session.feedbackText || "";

                if (!isAiEnabled) {
                  logger.info(`WhatsApp bot: AI Analysis bypassed (disabled in settings) for feedback ${feedbackId}`);
                  await supabase
                    .from("feedback")
                    .update({
                      summary: feedbackText.substring(0, 120) + (feedbackText.length > 120 ? "..." : ""),
                      category: "General",
                      sentiment: "Neutral",
                      priority: "Medium",
                      ai_processed: false,
                    })
                    .eq("id", feedbackId);
                  return;
                }

                logger.info(`WhatsApp bot: Starting AI Analysis for feedback ${feedbackId}`);
                const aiResult = await analyzeFeedback(feedbackText);
                await supabase
                  .from("feedback")
                  .update({
                    summary: aiResult.summary,
                    category: aiResult.category,
                    sentiment: aiResult.sentiment,
                    priority: aiResult.priority,
                    ai_processed: true,
                    ai_processed_at: new Date().toISOString(),
                  })
                  .eq("id", feedbackId);
              } catch (err) {
                logger.error(`Async AI Analysis failed for WhatsApp feedback ${feedbackId}:`, err);
              }
            };

            triggerAiAnalysis();

            // 6. Record in duplicate cache
            lastSubmissions.set(phone, {
              text: session.feedbackText,
              timestamp: new Date(),
            });

            // 7. Send improved acknowledgement
            const readableType =
              session.submissionType === "anonymous"
                ? "🔒 Anonymous"
                : session.submissionType === "principal_only"
                ? "👤 Principal Only"
                : "💬 Contact Me";

            const acknowledgementMsg =
              `🎉 Thank you! Your feedback has been successfully submitted to Ayesha Ali Academy.\n\n` +
              `Reference Number: ${feedbackData.tracking_number}\n` +
              `Submission Type: ${readableType}\n` +
              `Status: Received (Pending Review)\n\n` +
              `Please save this number. You can track the status of this submission anytime using Option 2 from the main menu.`;

            await messagingService.sendMessage(rawPhone, acknowledgementMsg);

            // Clean up session inputs (keep cached contacts)
            session.step = "idle";
            session.evidence = [];
            delete session.submissionType;
            delete session.feedbackText;
            delete session.studentId;
            delete session.relationship;
            delete session.feedbackScope;
            delete (session as any).submitterName;
          } else {
            await messagingService.sendMessage(rawPhone, `❌ Invalid option. Please attach an image/screenshot or reply with "done" to submit.`);
          }
          break;
        }

        case "awaiting_tracking_no": {
          const trackingNo = text.toUpperCase();

          const { data: feedback, error: queryError } = await supabase
            .from("feedback")
            .select("tracking_number, status, category, last_action_note, status_updated_at")
            .eq("tracking_number", trackingNo)
            .maybeSingle();

          if (queryError) {
            logger.error(`Error querying tracking number ${trackingNo}:`, queryError);
            await messagingService.sendMessage(rawPhone, `❌ An error occurred while searching. Please try again later.`);
            return;
          }

          if (feedback) {
            const updatedDate = new Date(feedback.status_updated_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            const statusMap: Record<string, string> = {
              new: "Received 📥",
              under_review: "Under Review 🔍",
              resolved: "Resolved ✅",
              closed: "Closed 📁",
            };

            const statusText = statusMap[feedback.status] || feedback.status;

            const trackingResult =
              `🔍 Feedback Tracking Details\n` +
              `──────────────────────\n` +
              `Reference Number: ${feedback.tracking_number}\n` +
              `Status: ${statusText}\n` +
              `Category: ${feedback.category || "Pending AI Categorisation"}\n` +
              `Latest Update: ${feedback.last_action_note || "Feedback submitted."}\n` +
              `Updated: ${updatedDate}\n\n` +
              `Reply with "menu" to return.`;

            await messagingService.sendMessage(rawPhone, trackingResult);
            session.step = "idle";
          } else {
            await messagingService.sendMessage(
              rawPhone,
              `❌ No feedback found with tracking number "${trackingNo}".\n\nPlease check the number and try again, or reply with "menu" to return.`
            );
          }
          break;
        }
      }
    } catch (err) {
      logger.error(`Error in WhatsApp Bot step execution (${session.step}) for ${phone}:`, err);
      await messagingService.sendMessage(
        rawPhone,
        `❌ An unexpected error occurred while processing your request. Please reply with "menu" to restart.`
      );
      session.step = "idle";
      session.evidence = [];
    }
  });
}
