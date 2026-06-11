import { FeedbackCategory, FeedbackSentiment, FeedbackPriority, FeedbackStatus, FeedbackType } from "../types/feedback";
export declare const CATEGORY_LABELS: Record<FeedbackCategory, string>;
/** Tailwind CSS color classes for category badges */
export declare const CATEGORY_COLORS: Record<FeedbackCategory, {
    bg: string;
    text: string;
    dot: string;
}>;
export declare const SENTIMENT_LABELS: Record<FeedbackSentiment, string>;
export declare const SENTIMENT_COLORS: Record<FeedbackSentiment, {
    bg: string;
    text: string;
    dot: string;
}>;
export declare const PRIORITY_LABELS: Record<FeedbackPriority, string>;
export declare const PRIORITY_COLORS: Record<FeedbackPriority, {
    bg: string;
    text: string;
    dot: string;
    border: string;
}>;
export declare const STATUS_LABELS: Record<FeedbackStatus, string>;
export declare const STATUS_COLORS: Record<FeedbackStatus, {
    bg: string;
    text: string;
    dot: string;
}>;
export declare const SUBMISSION_TYPE_LABELS: Record<FeedbackType, string>;
export declare const PRIORITY_ORDER: Record<FeedbackPriority, number>;
export declare const APP_NAME = "AAA Feedback";
export declare const APP_FULL_NAME = "Ayesha Ali Academy Feedback Management System";
export declare const INSTITUTION_NAME = "Ayesha Ali Academy";
export declare const DEVELOPER_NAME = "Burhan Hamid";
export declare const DEFAULT_PAGE_SIZE = 20;
export declare const MAX_PAGE_SIZE = 100;
export declare const MAX_EVIDENCE_FILES = 3;
export declare const MAX_FILE_SIZE_BYTES: number;
//# sourceMappingURL=index.d.ts.map