import { Admin } from "./admin";

// ============================================================
// Feedback Core Types
// Ayesha Ali Academy Feedback Management System
// ============================================================

/**
 * How the feedback was submitted — determines identity visibility.
 */
export enum FeedbackType {
  /** Identity is never stored. Principal sees feedback/summary/evidence only. */
  ANONYMOUS = "anonymous",
  /** Identity stored and visible to Principal role only. */
  PRINCIPAL_ONLY = "principal_only",
  /** Identity stored, visible to Principal. Principal may contact submitter. */
  CONTACT_ME = "contact_me",
}

/**
 * The relationship of the person submitting the feedback to the verified student record.
 * The admission number identifies the student, not necessarily the submitter.
 */
export enum FeedbackSubmitterType {
  STUDENT = "Student",
  PARENT = "Parent",
  GUARDIAN = "Guardian",
  UNKNOWN = "Unknown",
}

/**
 * The scope of the feedback submission.
 */
export enum FeedbackScope {
  STUDENT_SPECIFIC = "student_specific",
  MULTIPLE_STUDENTS = "multiple_students",
  GENERAL_SCHOOL = "general_school",
}

/**
 * Lifecycle status of a feedback item.
 */
export enum FeedbackStatus {
  NEW = "new",
  UNDER_REVIEW = "under_review",
  RESOLVED = "resolved",
  CLOSED = "closed",
}

/**
 * AI-assigned category for the feedback.
 */
export enum FeedbackCategory {
  ACADEMICS = "Academics",
  TRANSPORT = "Transport",
  INFRASTRUCTURE = "Infrastructure",
  STAFF = "Staff",
  DISCIPLINE = "Discipline",
  ADMINISTRATION = "Administration",
  FACILITIES = "Facilities",
  SAFETY = "Safety",
  GENERAL = "General",
  OTHER = "Other",
}

/**
 * AI-assessed sentiment of the feedback.
 */
export enum FeedbackSentiment {
  POSITIVE = "Positive",
  NEUTRAL = "Neutral",
  NEGATIVE = "Negative",
  MIXED = "Mixed",
}

/**
 * AI-assessed priority level for the feedback.
 */
export enum FeedbackPriority {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High",
  CRITICAL = "Critical",
}

// ============================================================
// Core Interfaces
// ============================================================

export interface Feedback {
  id: string;
  submission_type: FeedbackType;
  /** Who submitted the feedback relative to the verified student record. */
  submitter_type: FeedbackSubmitterType;
  raw_text: string;

  // AI-generated fields (null while processing)
  summary: string | null;
  category: FeedbackCategory | null;
  sentiment: FeedbackSentiment | null;
  priority: FeedbackPriority | null;
  ai_processed: boolean;
  ai_processed_at: string | null; // ISO 8601
  resolved_at: string | null; // ISO 8601

  // Verification details (Admission Number Validation System)
  student_id: string | null;
  feedback_scope: FeedbackScope;
  submitter_relationship?: string | null;
  is_anonymous: boolean;
  verification_status: string;
  verified_at: string | null; // ISO 8601
  student?: Student | null;

  // Identity (null for anonymous, populated for other types)
  submitter_name: string | null;
  submitter_phone: string | null;

  status: FeedbackStatus;
  cluster_id: string | null;
  whatsapp_message_id: string | null;

  // Tracking & Status Updates (Phase 9)
  tracking_number: string | null;
  last_action_note: string | null;
  status_updated_at: string; // ISO 8601

  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601

  // Joined relations (optional, depends on query)
  evidence?: FeedbackEvidence[];
  comments?: FeedbackComment[];
  timeline?: FeedbackTimelineEvent[];
}

export interface FeedbackEvidence {
  id: string;
  feedback_id: string;
  file_url: string;
  file_type: "image" | "document";
  file_size: number | null;
  uploaded_at: string; // ISO 8601
}

export interface FeedbackComment {
  id: string;
  feedback_id: string;
  admin_id: string;
  comment_text: string;
  created_at: string; // ISO 8601

  // Joined
  admin?: Admin;
}

export interface FeedbackTimelineEvent {
  id: string;
  feedback_id: string;
  status: FeedbackStatus;
  action_note: string;
  created_at: string; // ISO 8601
}


// ============================================================
// Students (Admission Number Validation System)
// ============================================================

export interface Student {
  id: string;
  admission_no: string;
  student_name: string;
  class: string;
  section: string;
  /** Parent/guardian fields — may be null until populated from ERP or admin. */
  parent_name: string | null;
  parent_phone: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

// ============================================================
// Issue Clusters (Duplicate Detection)
// ============================================================

export interface IssueCluster {
  id: string;
  title: string;
  description: string | null;
  category: FeedbackCategory | null;
  report_count: number;
  status: "open" | "resolved";
  first_seen_at: string; // ISO 8601
  last_seen_at: string; // ISO 8601
  created_at: string; // ISO 8601

  // Joined
  feedback?: Feedback[];
}

// ============================================================
// Audit Log
// ============================================================

export type AuditAction =
  | "status_change"
  | "comment_added"
  | "login"
  | "logout"
  | "feedback_viewed"
  | "cluster_created"
  | "cluster_merged"
  | "report_generated"
  | "ai_reprocessed"
  | "verification_success"
  | "verification_failure";

export interface AuditLog {
  id: string;
  admin_id: string | null;
  action: AuditAction;
  entity_type: "feedback" | "cluster" | "admin" | null;
  entity_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string; // ISO 8601
}

// ============================================================
// Reports
// ============================================================

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
  date: string; // YYYY-MM-DD
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
  report_month: string; // YYYY-MM-01
  total_feedback: number;
  category_breakdown: CategoryBreakdown[];
  sentiment_breakdown: SentimentBreakdown[];
  top_issues: IssueCluster[];
  generated_at: string; // ISO 8601
}

// ============================================================
// API Response Wrappers
// ============================================================

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

// ============================================================
// API Query Parameters
// ============================================================

export interface FeedbackListParams {
  page?: number;
  limit?: number;
  status?: FeedbackStatus;
  category?: string;
  sentiment?: string;
  priority?: string;
  submission_type?: FeedbackType;
  date_from?: string; // ISO 8601
  date_to?: string; // ISO 8601
  search?: string;
  sort_by?: "created_at" | "updated_at" | "priority";
  sort_order?: "asc" | "desc";
}

// ============================================================
// Analytics & Reporting (Phase 4)
// ============================================================

export interface ResolutionMetrics {
  total_resolved: number;
  open_issues: number;
  resolution_rate: number; // percentage
  avg_resolution_time_hours: number;
  monthly_trends: Array<{ month: string; resolved_count: number; avg_time_hours: number }>;
}

export interface CategoryDistribution {
  category: FeedbackCategory;
  count: number;
  percentage: number;
}

export interface SentimentDistribution {
  sentiment: FeedbackSentiment;
  count: number;
  percentage: number;
}

export interface PriorityDistribution {
  priority: FeedbackPriority;
  count: number;
  percentage: number;
}

export interface StatusDistribution {
  status: FeedbackStatus;
  count: number;
  percentage: number;
}

export interface MostReportedIssue {
  category: FeedbackCategory;
  count: number;
}

export interface SubmitterTypeDistribution {
  submitter_type: FeedbackSubmitterType;
  count: number;
  percentage: number;
}

export interface AnalyticsData {
  kpis: {
    total_feedback: number;
    positive_feedback: number;
    negative_feedback: number;
    mixed_feedback: number;
    neutral_feedback: number;
    critical_issues: number;
    open_issues: number;
    resolved_issues: number;
    under_review_issues: number;
    pending_ai_processing: number;
  };
  trends: Array<{
    date: string; // YYYY-MM-DD
    total: number;
    positive: number;
    negative: number;
    neutral: number;
    mixed: number;
    critical: number;
  }>;
  categories: CategoryDistribution[];
  sentiments: SentimentDistribution[];
  priorities: PriorityDistribution[];
  statuses: StatusDistribution[];
  submitterTypes: SubmitterTypeDistribution[];
  resolution: ResolutionMetrics;
  mostReported: MostReportedIssue[];
}

