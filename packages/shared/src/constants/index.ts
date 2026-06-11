import {
  FeedbackCategory,
  FeedbackSentiment,
  FeedbackPriority,
  FeedbackStatus,
  FeedbackType,
  FeedbackSubmitterType,
  FeedbackScope,
} from "../types/feedback";

// ============================================================
// Category Labels & Colors
// ============================================================

export const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  [FeedbackCategory.ACADEMICS]: "Academics",
  [FeedbackCategory.TRANSPORT]: "Transport",
  [FeedbackCategory.INFRASTRUCTURE]: "Infrastructure",
  [FeedbackCategory.STAFF]: "Staff",
  [FeedbackCategory.DISCIPLINE]: "Discipline",
  [FeedbackCategory.ADMINISTRATION]: "Administration",
  [FeedbackCategory.FACILITIES]: "Facilities",
  [FeedbackCategory.SAFETY]: "Safety",
  [FeedbackCategory.GENERAL]: "General",
  [FeedbackCategory.OTHER]: "Other",
};

/** Tailwind CSS color classes for category badges */
export const CATEGORY_COLORS: Record<
  FeedbackCategory,
  { bg: string; text: string; dot: string }
> = {
  [FeedbackCategory.ACADEMICS]: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    dot: "bg-blue-400",
  },
  [FeedbackCategory.TRANSPORT]: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    dot: "bg-amber-400",
  },
  [FeedbackCategory.INFRASTRUCTURE]: {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    dot: "bg-orange-400",
  },
  [FeedbackCategory.STAFF]: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    dot: "bg-purple-400",
  },
  [FeedbackCategory.DISCIPLINE]: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    dot: "bg-red-400",
  },
  [FeedbackCategory.ADMINISTRATION]: {
    bg: "bg-zinc-500/10",
    text: "text-zinc-400",
    dot: "bg-zinc-400",
  },
  [FeedbackCategory.FACILITIES]: {
    bg: "bg-teal-500/10",
    text: "text-teal-400",
    dot: "bg-teal-400",
  },
  [FeedbackCategory.SAFETY]: {
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    dot: "bg-rose-400",
  },
  [FeedbackCategory.GENERAL]: {
    bg: "bg-indigo-500/10",
    text: "text-indigo-400",
    dot: "bg-indigo-400",
  },
  [FeedbackCategory.OTHER]: {
    bg: "bg-zinc-500/10",
    text: "text-zinc-500",
    dot: "bg-zinc-500",
  },
};

// ============================================================
// Sentiment Labels & Colors
// ============================================================

export const SENTIMENT_LABELS: Record<FeedbackSentiment, string> = {
  [FeedbackSentiment.POSITIVE]: "Positive",
  [FeedbackSentiment.NEUTRAL]: "Neutral",
  [FeedbackSentiment.NEGATIVE]: "Negative",
  [FeedbackSentiment.MIXED]: "Mixed",
};

export const SENTIMENT_COLORS: Record<
  FeedbackSentiment,
  { bg: string; text: string; dot: string }
> = {
  [FeedbackSentiment.POSITIVE]: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  [FeedbackSentiment.NEUTRAL]: {
    bg: "bg-zinc-500/10",
    text: "text-zinc-400",
    dot: "bg-zinc-400",
  },
  [FeedbackSentiment.NEGATIVE]: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    dot: "bg-red-400",
  },
  [FeedbackSentiment.MIXED]: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    dot: "bg-amber-400",
  },
};

// ============================================================
// Priority Labels & Colors
// ============================================================

export const PRIORITY_LABELS: Record<FeedbackPriority, string> = {
  [FeedbackPriority.LOW]: "Low",
  [FeedbackPriority.MEDIUM]: "Medium",
  [FeedbackPriority.HIGH]: "High",
  [FeedbackPriority.CRITICAL]: "Critical",
};

export const PRIORITY_COLORS: Record<
  FeedbackPriority,
  { bg: string; text: string; dot: string; border: string }
> = {
  [FeedbackPriority.LOW]: {
    bg: "bg-zinc-500/10",
    text: "text-zinc-400",
    dot: "bg-zinc-400",
    border: "border-zinc-700",
  },
  [FeedbackPriority.MEDIUM]: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    dot: "bg-blue-400",
    border: "border-blue-800",
  },
  [FeedbackPriority.HIGH]: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    dot: "bg-amber-400",
    border: "border-amber-800",
  },
  [FeedbackPriority.CRITICAL]: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    dot: "bg-red-400",
    border: "border-red-800",
  },
};

// ============================================================
// Status Labels & Colors
// ============================================================

export const STATUS_LABELS: Record<FeedbackStatus, string> = {
  [FeedbackStatus.NEW]: "New",
  [FeedbackStatus.UNDER_REVIEW]: "Under Review",
  [FeedbackStatus.RESOLVED]: "Resolved",
  [FeedbackStatus.CLOSED]: "Closed",
};

export const STATUS_COLORS: Record<
  FeedbackStatus,
  { bg: string; text: string; dot: string }
> = {
  [FeedbackStatus.NEW]: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    dot: "bg-blue-400",
  },
  [FeedbackStatus.UNDER_REVIEW]: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    dot: "bg-amber-400",
  },
  [FeedbackStatus.RESOLVED]: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  [FeedbackStatus.CLOSED]: {
    bg: "bg-zinc-500/10",
    text: "text-zinc-500",
    dot: "bg-zinc-500",
  },
};

// ============================================================
// Submission Type Labels
// ============================================================

export const SUBMISSION_TYPE_LABELS: Record<FeedbackType, string> = {
  [FeedbackType.ANONYMOUS]: "Anonymous",
  [FeedbackType.PRINCIPAL_ONLY]: "Principal Only",
  [FeedbackType.CONTACT_ME]: "Contact Me",
};

// ============================================================
// Submitter Type Labels & Colors
// ============================================================

export const SUBMITTER_TYPE_LABELS: Record<FeedbackSubmitterType, string> = {
  [FeedbackSubmitterType.STUDENT]: "Student",
  [FeedbackSubmitterType.PARENT]: "Parent",
  [FeedbackSubmitterType.GUARDIAN]: "Guardian",
  [FeedbackSubmitterType.UNKNOWN]: "Unknown",
};

export const FEEDBACK_SCOPE_LABELS: Record<FeedbackScope, string> = {
  [FeedbackScope.STUDENT_SPECIFIC]: "Student Specific",
  [FeedbackScope.MULTIPLE_STUDENTS]: "Multiple Students",
  [FeedbackScope.GENERAL_SCHOOL]: "General School",
};

export const SUBMITTER_TYPE_COLORS: Record<
  FeedbackSubmitterType,
  { bg: string; text: string; dot: string }
> = {
  [FeedbackSubmitterType.STUDENT]: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    dot: "bg-blue-400",
  },
  [FeedbackSubmitterType.PARENT]: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    dot: "bg-purple-400",
  },
  [FeedbackSubmitterType.GUARDIAN]: {
    bg: "bg-teal-500/10",
    text: "text-teal-400",
    dot: "bg-teal-400",
  },
  [FeedbackSubmitterType.UNKNOWN]: {
    bg: "bg-zinc-500/10",
    text: "text-zinc-400",
    dot: "bg-zinc-400",
  },
};

// ============================================================
// Priority Sort Order (for sorting)
// ============================================================

export const PRIORITY_ORDER: Record<FeedbackPriority, number> = {
  [FeedbackPriority.CRITICAL]: 4,
  [FeedbackPriority.HIGH]: 3,
  [FeedbackPriority.MEDIUM]: 2,
  [FeedbackPriority.LOW]: 1,
};

// ============================================================
// App Constants
// ============================================================

export const APP_NAME = "AAA Feedback";
export const APP_FULL_NAME = "Ayesha Ali Academy Feedback Management System";
export const INSTITUTION_NAME = "Ayesha Ali Academy";
export const DEVELOPER_NAME = "Burhan Hamid";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MAX_EVIDENCE_FILES = 3;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
