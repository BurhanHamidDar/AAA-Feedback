"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackPriority = exports.FeedbackSentiment = exports.FeedbackCategory = exports.FeedbackStatus = exports.FeedbackType = void 0;
// ============================================================
// Feedback Core Types
// Ayesha Ali Academy Feedback Management System
// ============================================================
/**
 * How the feedback was submitted — determines identity visibility.
 */
var FeedbackType;
(function (FeedbackType) {
    /** Identity is never stored. Principal sees feedback/summary/evidence only. */
    FeedbackType["ANONYMOUS"] = "anonymous";
    /** Identity stored and visible to Principal role only. */
    FeedbackType["PRINCIPAL_ONLY"] = "principal_only";
    /** Identity stored, visible to Principal. Principal may contact submitter. */
    FeedbackType["CONTACT_ME"] = "contact_me";
})(FeedbackType || (exports.FeedbackType = FeedbackType = {}));
/**
 * Lifecycle status of a feedback item.
 */
var FeedbackStatus;
(function (FeedbackStatus) {
    FeedbackStatus["NEW"] = "new";
    FeedbackStatus["UNDER_REVIEW"] = "under_review";
    FeedbackStatus["RESOLVED"] = "resolved";
    FeedbackStatus["CLOSED"] = "closed";
})(FeedbackStatus || (exports.FeedbackStatus = FeedbackStatus = {}));
/**
 * AI-assigned category for the feedback.
 */
var FeedbackCategory;
(function (FeedbackCategory) {
    FeedbackCategory["ACADEMICS"] = "academics";
    FeedbackCategory["TRANSPORT"] = "transport";
    FeedbackCategory["INFRASTRUCTURE"] = "infrastructure";
    FeedbackCategory["STAFF"] = "staff";
    FeedbackCategory["DISCIPLINE"] = "discipline";
    FeedbackCategory["ADMINISTRATION"] = "administration";
    FeedbackCategory["FACILITIES"] = "facilities";
    FeedbackCategory["SAFETY"] = "safety";
    FeedbackCategory["GENERAL"] = "general";
    FeedbackCategory["OTHER"] = "other";
})(FeedbackCategory || (exports.FeedbackCategory = FeedbackCategory = {}));
/**
 * AI-assessed sentiment of the feedback.
 */
var FeedbackSentiment;
(function (FeedbackSentiment) {
    FeedbackSentiment["POSITIVE"] = "positive";
    FeedbackSentiment["NEUTRAL"] = "neutral";
    FeedbackSentiment["NEGATIVE"] = "negative";
    FeedbackSentiment["MIXED"] = "mixed";
})(FeedbackSentiment || (exports.FeedbackSentiment = FeedbackSentiment = {}));
/**
 * AI-assessed priority level for the feedback.
 */
var FeedbackPriority;
(function (FeedbackPriority) {
    FeedbackPriority["LOW"] = "low";
    FeedbackPriority["MEDIUM"] = "medium";
    FeedbackPriority["HIGH"] = "high";
    FeedbackPriority["CRITICAL"] = "critical";
})(FeedbackPriority || (exports.FeedbackPriority = FeedbackPriority = {}));
//# sourceMappingURL=feedback.js.map