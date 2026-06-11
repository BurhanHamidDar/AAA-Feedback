"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppWebhookSchema = exports.MergeClustersSchema = exports.ReportQuerySchema = exports.PresignUploadSchema = exports.LoginSchema = exports.AddCommentSchema = exports.UpdateFeedbackStatusSchema = exports.FeedbackListQuerySchema = void 0;
const zod_1 = require("zod");
const feedback_1 = require("../types/feedback");
// ============================================================
// Feedback List Query Schema
// ============================================================
exports.FeedbackListQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    status: zod_1.z.nativeEnum(feedback_1.FeedbackStatus).optional(),
    category: zod_1.z.nativeEnum(feedback_1.FeedbackCategory).optional(),
    sentiment: zod_1.z.nativeEnum(feedback_1.FeedbackSentiment).optional(),
    priority: zod_1.z.nativeEnum(feedback_1.FeedbackPriority).optional(),
    submission_type: zod_1.z.nativeEnum(feedback_1.FeedbackType).optional(),
    date_from: zod_1.z.string().datetime({ offset: true }).optional(),
    date_to: zod_1.z.string().datetime({ offset: true }).optional(),
    search: zod_1.z.string().max(200).optional(),
    sort_by: zod_1.z
        .enum(["created_at", "updated_at", "ai_priority"])
        .default("created_at"),
    sort_order: zod_1.z.enum(["asc", "desc"]).default("desc"),
});
// ============================================================
// Feedback Status Update Schema
// ============================================================
exports.UpdateFeedbackStatusSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(feedback_1.FeedbackStatus),
});
// ============================================================
// Comment Schema
// ============================================================
exports.AddCommentSchema = zod_1.z.object({
    comment_text: zod_1.z
        .string()
        .min(1, "Comment cannot be empty")
        .max(2000, "Comment too long (max 2000 characters)"),
});
// ============================================================
// Auth Schemas
// ============================================================
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z
        .string()
        .min(6, "Password must be at least 6 characters")
        .max(128, "Password too long"),
});
// ============================================================
// Upload Presign Schema
// ============================================================
exports.PresignUploadSchema = zod_1.z.object({
    feedback_id: zod_1.z.string().uuid("Invalid feedback ID"),
    file_name: zod_1.z.string().min(1).max(255),
    file_type: zod_1.z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
    file_size: zod_1.z.number().int().min(1).max(10 * 1024 * 1024), // max 10MB
});
// ============================================================
// Report Query Schema
// ============================================================
exports.ReportQuerySchema = zod_1.z.object({
    month: zod_1.z
        .string()
        .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be in YYYY-MM format")
        .optional(),
});
// ============================================================
// Cluster Schemas
// ============================================================
exports.MergeClustersSchema = zod_1.z.object({
    source_cluster_id: zod_1.z.string().uuid(),
    target_cluster_id: zod_1.z.string().uuid(),
});
// ============================================================
// WhatsApp Webhook Schema (Meta Cloud API)
// ============================================================
exports.WhatsAppWebhookSchema = zod_1.z.object({
    object: zod_1.z.string(),
    entry: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        changes: zod_1.z.array(zod_1.z.object({
            value: zod_1.z.object({
                messaging_product: zod_1.z.string(),
                metadata: zod_1.z.object({
                    display_phone_number: zod_1.z.string(),
                    phone_number_id: zod_1.z.string(),
                }),
                messages: zod_1.z
                    .array(zod_1.z.object({
                    id: zod_1.z.string(),
                    from: zod_1.z.string(),
                    timestamp: zod_1.z.string(),
                    type: zod_1.z.string(),
                    text: zod_1.z.object({ body: zod_1.z.string() }).optional(),
                    image: zod_1.z
                        .object({ id: zod_1.z.string(), mime_type: zod_1.z.string() })
                        .optional(),
                    interactive: zod_1.z
                        .object({
                        type: zod_1.z.string(),
                        button_reply: zod_1.z
                            .object({ id: zod_1.z.string(), title: zod_1.z.string() })
                            .optional(),
                        list_reply: zod_1.z
                            .object({ id: zod_1.z.string(), title: zod_1.z.string() })
                            .optional(),
                    })
                        .optional(),
                }))
                    .optional(),
            }),
            field: zod_1.z.string(),
        })),
    })),
});
//# sourceMappingURL=feedback.js.map