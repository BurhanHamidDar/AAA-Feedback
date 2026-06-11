import { Admin } from "./admin";
/**
 * How the feedback was submitted — determines identity visibility.
 */
export declare enum FeedbackType {
    /** Identity is never stored. Principal sees feedback/summary/evidence only. */
    ANONYMOUS = "anonymous",
    /** Identity stored and visible to Principal role only. */
    PRINCIPAL_ONLY = "principal_only",
    /** Identity stored, visible to Principal. Principal may contact submitter. */
    CONTACT_ME = "contact_me"
}
/**
 * Lifecycle status of a feedback item.
 */
export declare enum FeedbackStatus {
    NEW = "new",
    UNDER_REVIEW = "under_review",
    RESOLVED = "resolved",
    CLOSED = "closed"
}
/**
 * AI-assigned category for the feedback.
 */
export declare enum FeedbackCategory {
    ACADEMICS = "academics",
    TRANSPORT = "transport",
    INFRASTRUCTURE = "infrastructure",
    STAFF = "staff",
    DISCIPLINE = "discipline",
    ADMINISTRATION = "administration",
    FACILITIES = "facilities",
    SAFETY = "safety",
    GENERAL = "general",
    OTHER = "other"
}
/**
 * AI-assessed sentiment of the feedback.
 */
export declare enum FeedbackSentiment {
    POSITIVE = "positive",
    NEUTRAL = "neutral",
    NEGATIVE = "negative",
    MIXED = "mixed"
}
/**
 * AI-assessed priority level for the feedback.
 */
export declare enum FeedbackPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export interface Feedback {
    id: string;
    submission_type: FeedbackType;
    raw_text: string;
    ai_summary: string | null;
    ai_category: FeedbackCategory | null;
    ai_sentiment: FeedbackSentiment | null;
    ai_priority: FeedbackPriority | null;
    ai_processed_at: string | null;
    submitter_name: string | null;
    submitter_phone: string | null;
    status: FeedbackStatus;
    cluster_id: string | null;
    whatsapp_message_id: string | null;
    created_at: string;
    updated_at: string;
    evidence?: FeedbackEvidence[];
    comments?: FeedbackComment[];
}
export interface FeedbackEvidence {
    id: string;
    feedback_id: string;
    file_url: string;
    file_type: "image" | "document";
    file_size: number | null;
    uploaded_at: string;
}
export interface FeedbackComment {
    id: string;
    feedback_id: string;
    admin_id: string;
    comment_text: string;
    created_at: string;
    admin?: Admin;
}
export interface IssueCluster {
    id: string;
    title: string;
    description: string | null;
    category: FeedbackCategory | null;
    report_count: number;
    status: "open" | "resolved";
    first_seen_at: string;
    last_seen_at: string;
    created_at: string;
    feedback?: Feedback[];
}
export type AuditAction = "status_change" | "comment_added" | "login" | "logout" | "feedback_viewed" | "cluster_created" | "cluster_merged" | "report_generated" | "ai_reprocessed";
export interface AuditLog {
    id: string;
    admin_id: string | null;
    action: AuditAction;
    entity_type: "feedback" | "cluster" | "admin" | null;
    entity_id: string | null;
    old_value: Record<string, unknown> | null;
    new_value: Record<string, unknown> | null;
    created_at: string;
}
export interface CategoryBreakdown {
    category: FeedbackCategory;
    count: number;
    percentage: number;
}
export interface SentimentBreakdown {
    sentiment: FeedbackSentiment;
    count: number;
    percentage: number;
}
export interface MonthlyTrendPoint {
    date: string;
    total: number;
    positive: number;
    negative: number;
    critical: number;
}
export interface DashboardStats {
    total_feedback: number;
    positive_feedback: number;
    negative_feedback: number;
    critical_issues: number;
    open_issues: number;
    resolved_issues: number;
    pending_ai_processing: number;
}
export interface MonthlyReport {
    id: string;
    report_month: string;
    total_feedback: number;
    category_breakdown: CategoryBreakdown[];
    sentiment_breakdown: SentimentBreakdown[];
    top_issues: IssueCluster[];
    generated_at: string;
}
export interface ApiResponse<T> {
    success: true;
    data: T;
}
export interface ApiError {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
}
export interface PaginatedResponse<T> {
    success: true;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
        has_next: boolean;
        has_prev: boolean;
    };
}
export interface FeedbackListParams {
    page?: number;
    limit?: number;
    status?: FeedbackStatus;
    category?: FeedbackCategory;
    sentiment?: FeedbackSentiment;
    priority?: FeedbackPriority;
    submission_type?: FeedbackType;
    date_from?: string;
    date_to?: string;
    search?: string;
    sort_by?: "created_at" | "updated_at" | "ai_priority";
    sort_order?: "asc" | "desc";
}
//# sourceMappingURL=feedback.d.ts.map