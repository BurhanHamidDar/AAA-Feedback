import { z } from "zod";
import {
  FeedbackType,
  FeedbackStatus,
} from "../types/feedback";

// ============================================================
// Feedback List Query Schema
// ============================================================

export const FeedbackListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(FeedbackStatus).optional(),
  category: z.string().optional(),
  sentiment: z.string().optional(),
  priority: z.string().optional(),
  submission_type: z.nativeEnum(FeedbackType).optional(),
  date_from: z.string().datetime({ offset: true }).optional(),
  date_to: z.string().datetime({ offset: true }).optional(),
  search: z.string().max(200).optional(),
  sort_by: z
    .enum(["created_at", "updated_at", "priority"])
    .default("created_at"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});

export type FeedbackListQuery = z.infer<typeof FeedbackListQuerySchema>;

// ============================================================
// Feedback Status Update Schema
// ============================================================

export const UpdateFeedbackStatusSchema = z.object({
  status: z.nativeEnum(FeedbackStatus),
  last_action_note: z.string().optional(),
});


export type UpdateFeedbackStatusInput = z.infer<
  typeof UpdateFeedbackStatusSchema
>;

// ============================================================
// Comment Schema
// ============================================================

export const AddCommentSchema = z.object({
  comment_text: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment too long (max 2000 characters)"),
});

export type AddCommentInput = z.infer<typeof AddCommentSchema>;

// ============================================================
// Auth Schemas
// ============================================================

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password too long"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// ============================================================
// Upload Presign Schema
// ============================================================

export const PresignUploadSchema = z.object({
  feedback_id: z.string().uuid("Invalid feedback ID"),
  file_name: z.string().min(1).max(255),
  file_type: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
  file_size: z.number().int().min(1).max(10 * 1024 * 1024), // max 10MB
});

export type PresignUploadInput = z.infer<typeof PresignUploadSchema>;

// ============================================================
// Report Query Schema
// ============================================================

export const ReportQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be in YYYY-MM format")
    .optional(),
});

export type ReportQuery = z.infer<typeof ReportQuerySchema>;

// ============================================================
// Cluster Schemas
// ============================================================

export const MergeClustersSchema = z.object({
  source_cluster_id: z.string().uuid(),
  target_cluster_id: z.string().uuid(),
});

export type MergeClustersInput = z.infer<typeof MergeClustersSchema>;

// ============================================================
// WhatsApp Webhook Schema (Meta Cloud API)
// ============================================================

export const WhatsAppWebhookSchema = z.object({
  object: z.string(),
  entry: z.array(
    z.object({
      id: z.string(),
      changes: z.array(
        z.object({
          value: z.object({
            messaging_product: z.string(),
            metadata: z.object({
              display_phone_number: z.string(),
              phone_number_id: z.string(),
            }),
            messages: z
              .array(
                z.object({
                  id: z.string(),
                  from: z.string(),
                  timestamp: z.string(),
                  type: z.string(),
                  text: z.object({ body: z.string() }).optional(),
                  image: z
                    .object({ id: z.string(), mime_type: z.string() })
                    .optional(),
                  interactive: z
                    .object({
                      type: z.string(),
                      button_reply: z
                        .object({ id: z.string(), title: z.string() })
                        .optional(),
                      list_reply: z
                        .object({ id: z.string(), title: z.string() })
                        .optional(),
                    })
                    .optional(),
                })
              )
              .optional(),
          }),
          field: z.string(),
        })
      ),
    })
  ),
});

export type WhatsAppWebhook = z.infer<typeof WhatsAppWebhookSchema>;

// ============================================================
// Admission Number Verification Schema
// ============================================================

export const VerifyAdmissionSchema = z.object({
  whatsapp_number: z
    .string()
    .min(10, "WhatsApp number must be at least 10 characters")
    .max(20, "WhatsApp number too long")
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid WhatsApp phone number format"),
  admission_no: z
    .string()
    .min(1, "Admission number is required")
    .max(50, "Admission number too long")
    .regex(/^AAA\d{2}\/[A-Z]{2}\/\d{4}$/, "Invalid admission number format. Example: AAA19/GI/0270"),
});

export type VerifyAdmissionInput = z.infer<typeof VerifyAdmissionSchema>;

