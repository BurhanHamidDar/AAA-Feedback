"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_FILE_SIZE_BYTES = exports.MAX_EVIDENCE_FILES = exports.MAX_PAGE_SIZE = exports.DEFAULT_PAGE_SIZE = exports.DEVELOPER_NAME = exports.INSTITUTION_NAME = exports.APP_FULL_NAME = exports.APP_NAME = exports.PRIORITY_ORDER = exports.SUBMISSION_TYPE_LABELS = exports.STATUS_COLORS = exports.STATUS_LABELS = exports.PRIORITY_COLORS = exports.PRIORITY_LABELS = exports.SENTIMENT_COLORS = exports.SENTIMENT_LABELS = exports.CATEGORY_COLORS = exports.CATEGORY_LABELS = void 0;
const feedback_1 = require("../types/feedback");
// ============================================================
// Category Labels & Colors
// ============================================================
exports.CATEGORY_LABELS = {
    [feedback_1.FeedbackCategory.ACADEMICS]: "Academics",
    [feedback_1.FeedbackCategory.TRANSPORT]: "Transport",
    [feedback_1.FeedbackCategory.INFRASTRUCTURE]: "Infrastructure",
    [feedback_1.FeedbackCategory.STAFF]: "Staff",
    [feedback_1.FeedbackCategory.DISCIPLINE]: "Discipline",
    [feedback_1.FeedbackCategory.ADMINISTRATION]: "Administration",
    [feedback_1.FeedbackCategory.FACILITIES]: "Facilities",
    [feedback_1.FeedbackCategory.SAFETY]: "Safety",
    [feedback_1.FeedbackCategory.GENERAL]: "General",
    [feedback_1.FeedbackCategory.OTHER]: "Other",
};
/** Tailwind CSS color classes for category badges */
exports.CATEGORY_COLORS = {
    [feedback_1.FeedbackCategory.ACADEMICS]: {
        bg: "bg-blue-500/10",
        text: "text-blue-400",
        dot: "bg-blue-400",
    },
    [feedback_1.FeedbackCategory.TRANSPORT]: {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        dot: "bg-amber-400",
    },
    [feedback_1.FeedbackCategory.INFRASTRUCTURE]: {
        bg: "bg-orange-500/10",
        text: "text-orange-400",
        dot: "bg-orange-400",
    },
    [feedback_1.FeedbackCategory.STAFF]: {
        bg: "bg-purple-500/10",
        text: "text-purple-400",
        dot: "bg-purple-400",
    },
    [feedback_1.FeedbackCategory.DISCIPLINE]: {
        bg: "bg-red-500/10",
        text: "text-red-400",
        dot: "bg-red-400",
    },
    [feedback_1.FeedbackCategory.ADMINISTRATION]: {
        bg: "bg-zinc-500/10",
        text: "text-zinc-400",
        dot: "bg-zinc-400",
    },
    [feedback_1.FeedbackCategory.FACILITIES]: {
        bg: "bg-teal-500/10",
        text: "text-teal-400",
        dot: "bg-teal-400",
    },
    [feedback_1.FeedbackCategory.SAFETY]: {
        bg: "bg-rose-500/10",
        text: "text-rose-400",
        dot: "bg-rose-400",
    },
    [feedback_1.FeedbackCategory.GENERAL]: {
        bg: "bg-indigo-500/10",
        text: "text-indigo-400",
        dot: "bg-indigo-400",
    },
    [feedback_1.FeedbackCategory.OTHER]: {
        bg: "bg-zinc-500/10",
        text: "text-zinc-500",
        dot: "bg-zinc-500",
    },
};
// ============================================================
// Sentiment Labels & Colors
// ============================================================
exports.SENTIMENT_LABELS = {
    [feedback_1.FeedbackSentiment.POSITIVE]: "Positive",
    [feedback_1.FeedbackSentiment.NEUTRAL]: "Neutral",
    [feedback_1.FeedbackSentiment.NEGATIVE]: "Negative",
    [feedback_1.FeedbackSentiment.MIXED]: "Mixed",
};
exports.SENTIMENT_COLORS = {
    [feedback_1.FeedbackSentiment.POSITIVE]: {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        dot: "bg-emerald-400",
    },
    [feedback_1.FeedbackSentiment.NEUTRAL]: {
        bg: "bg-zinc-500/10",
        text: "text-zinc-400",
        dot: "bg-zinc-400",
    },
    [feedback_1.FeedbackSentiment.NEGATIVE]: {
        bg: "bg-red-500/10",
        text: "text-red-400",
        dot: "bg-red-400",
    },
    [feedback_1.FeedbackSentiment.MIXED]: {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        dot: "bg-amber-400",
    },
};
// ============================================================
// Priority Labels & Colors
// ============================================================
exports.PRIORITY_LABELS = {
    [feedback_1.FeedbackPriority.LOW]: "Low",
    [feedback_1.FeedbackPriority.MEDIUM]: "Medium",
    [feedback_1.FeedbackPriority.HIGH]: "High",
    [feedback_1.FeedbackPriority.CRITICAL]: "Critical",
};
exports.PRIORITY_COLORS = {
    [feedback_1.FeedbackPriority.LOW]: {
        bg: "bg-zinc-500/10",
        text: "text-zinc-400",
        dot: "bg-zinc-400",
        border: "border-zinc-700",
    },
    [feedback_1.FeedbackPriority.MEDIUM]: {
        bg: "bg-blue-500/10",
        text: "text-blue-400",
        dot: "bg-blue-400",
        border: "border-blue-800",
    },
    [feedback_1.FeedbackPriority.HIGH]: {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        dot: "bg-amber-400",
        border: "border-amber-800",
    },
    [feedback_1.FeedbackPriority.CRITICAL]: {
        bg: "bg-red-500/10",
        text: "text-red-400",
        dot: "bg-red-400",
        border: "border-red-800",
    },
};
// ============================================================
// Status Labels & Colors
// ============================================================
exports.STATUS_LABELS = {
    [feedback_1.FeedbackStatus.NEW]: "New",
    [feedback_1.FeedbackStatus.UNDER_REVIEW]: "Under Review",
    [feedback_1.FeedbackStatus.RESOLVED]: "Resolved",
    [feedback_1.FeedbackStatus.CLOSED]: "Closed",
};
exports.STATUS_COLORS = {
    [feedback_1.FeedbackStatus.NEW]: {
        bg: "bg-blue-500/10",
        text: "text-blue-400",
        dot: "bg-blue-400",
    },
    [feedback_1.FeedbackStatus.UNDER_REVIEW]: {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        dot: "bg-amber-400",
    },
    [feedback_1.FeedbackStatus.RESOLVED]: {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        dot: "bg-emerald-400",
    },
    [feedback_1.FeedbackStatus.CLOSED]: {
        bg: "bg-zinc-500/10",
        text: "text-zinc-500",
        dot: "bg-zinc-500",
    },
};
// ============================================================
// Submission Type Labels
// ============================================================
exports.SUBMISSION_TYPE_LABELS = {
    [feedback_1.FeedbackType.ANONYMOUS]: "Anonymous",
    [feedback_1.FeedbackType.PRINCIPAL_ONLY]: "Principal Only",
    [feedback_1.FeedbackType.CONTACT_ME]: "Contact Me",
};
// ============================================================
// Priority Sort Order (for sorting)
// ============================================================
exports.PRIORITY_ORDER = {
    [feedback_1.FeedbackPriority.CRITICAL]: 4,
    [feedback_1.FeedbackPriority.HIGH]: 3,
    [feedback_1.FeedbackPriority.MEDIUM]: 2,
    [feedback_1.FeedbackPriority.LOW]: 1,
};
// ============================================================
// App Constants
// ============================================================
exports.APP_NAME = "AAA Feedback";
exports.APP_FULL_NAME = "Ayesha Ali Academy Feedback Management System";
exports.INSTITUTION_NAME = "Ayesha Ali Academy";
exports.DEVELOPER_NAME = "Burhan Hamid";
exports.DEFAULT_PAGE_SIZE = 20;
exports.MAX_PAGE_SIZE = 100;
exports.MAX_EVIDENCE_FILES = 3;
exports.MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
//# sourceMappingURL=index.js.map