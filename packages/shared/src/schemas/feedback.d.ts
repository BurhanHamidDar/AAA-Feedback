import { z } from "zod";
import { FeedbackType, FeedbackStatus, FeedbackCategory, FeedbackSentiment, FeedbackPriority } from "../types/feedback";
export declare const FeedbackListQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof FeedbackStatus>>;
    category: z.ZodOptional<z.ZodNativeEnum<typeof FeedbackCategory>>;
    sentiment: z.ZodOptional<z.ZodNativeEnum<typeof FeedbackSentiment>>;
    priority: z.ZodOptional<z.ZodNativeEnum<typeof FeedbackPriority>>;
    submission_type: z.ZodOptional<z.ZodNativeEnum<typeof FeedbackType>>;
    date_from: z.ZodOptional<z.ZodString>;
    date_to: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    sort_by: z.ZodDefault<z.ZodEnum<["created_at", "updated_at", "ai_priority"]>>;
    sort_order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    sort_by: "created_at" | "updated_at" | "ai_priority";
    sort_order: "asc" | "desc";
    status?: FeedbackStatus | undefined;
    category?: FeedbackCategory | undefined;
    sentiment?: FeedbackSentiment | undefined;
    priority?: FeedbackPriority | undefined;
    submission_type?: FeedbackType | undefined;
    date_from?: string | undefined;
    date_to?: string | undefined;
    search?: string | undefined;
}, {
    limit?: number | undefined;
    page?: number | undefined;
    status?: FeedbackStatus | undefined;
    category?: FeedbackCategory | undefined;
    sentiment?: FeedbackSentiment | undefined;
    priority?: FeedbackPriority | undefined;
    submission_type?: FeedbackType | undefined;
    date_from?: string | undefined;
    date_to?: string | undefined;
    search?: string | undefined;
    sort_by?: "created_at" | "updated_at" | "ai_priority" | undefined;
    sort_order?: "asc" | "desc" | undefined;
}>;
export type FeedbackListQuery = z.infer<typeof FeedbackListQuerySchema>;
export declare const UpdateFeedbackStatusSchema: z.ZodObject<{
    status: z.ZodNativeEnum<typeof FeedbackStatus>;
}, "strip", z.ZodTypeAny, {
    status: FeedbackStatus;
}, {
    status: FeedbackStatus;
}>;
export type UpdateFeedbackStatusInput = z.infer<typeof UpdateFeedbackStatusSchema>;
export declare const AddCommentSchema: z.ZodObject<{
    comment_text: z.ZodString;
}, "strip", z.ZodTypeAny, {
    comment_text: string;
}, {
    comment_text: string;
}>;
export type AddCommentInput = z.infer<typeof AddCommentSchema>;
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type LoginInput = z.infer<typeof LoginSchema>;
export declare const PresignUploadSchema: z.ZodObject<{
    feedback_id: z.ZodString;
    file_name: z.ZodString;
    file_type: z.ZodEnum<["image/jpeg", "image/png", "image/webp", "image/gif"]>;
    file_size: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    feedback_id: string;
    file_name: string;
    file_type: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
    file_size: number;
}, {
    feedback_id: string;
    file_name: string;
    file_type: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
    file_size: number;
}>;
export type PresignUploadInput = z.infer<typeof PresignUploadSchema>;
export declare const ReportQuerySchema: z.ZodObject<{
    month: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    month?: string | undefined;
}, {
    month?: string | undefined;
}>;
export type ReportQuery = z.infer<typeof ReportQuerySchema>;
export declare const MergeClustersSchema: z.ZodObject<{
    source_cluster_id: z.ZodString;
    target_cluster_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    source_cluster_id: string;
    target_cluster_id: string;
}, {
    source_cluster_id: string;
    target_cluster_id: string;
}>;
export type MergeClustersInput = z.infer<typeof MergeClustersSchema>;
export declare const WhatsAppWebhookSchema: z.ZodObject<{
    object: z.ZodString;
    entry: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        changes: z.ZodArray<z.ZodObject<{
            value: z.ZodObject<{
                messaging_product: z.ZodString;
                metadata: z.ZodObject<{
                    display_phone_number: z.ZodString;
                    phone_number_id: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    display_phone_number: string;
                    phone_number_id: string;
                }, {
                    display_phone_number: string;
                    phone_number_id: string;
                }>;
                messages: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    id: z.ZodString;
                    from: z.ZodString;
                    timestamp: z.ZodString;
                    type: z.ZodString;
                    text: z.ZodOptional<z.ZodObject<{
                        body: z.ZodString;
                    }, "strip", z.ZodTypeAny, {
                        body: string;
                    }, {
                        body: string;
                    }>>;
                    image: z.ZodOptional<z.ZodObject<{
                        id: z.ZodString;
                        mime_type: z.ZodString;
                    }, "strip", z.ZodTypeAny, {
                        id: string;
                        mime_type: string;
                    }, {
                        id: string;
                        mime_type: string;
                    }>>;
                    interactive: z.ZodOptional<z.ZodObject<{
                        type: z.ZodString;
                        button_reply: z.ZodOptional<z.ZodObject<{
                            id: z.ZodString;
                            title: z.ZodString;
                        }, "strip", z.ZodTypeAny, {
                            id: string;
                            title: string;
                        }, {
                            id: string;
                            title: string;
                        }>>;
                        list_reply: z.ZodOptional<z.ZodObject<{
                            id: z.ZodString;
                            title: z.ZodString;
                        }, "strip", z.ZodTypeAny, {
                            id: string;
                            title: string;
                        }, {
                            id: string;
                            title: string;
                        }>>;
                    }, "strip", z.ZodTypeAny, {
                        type: string;
                        button_reply?: {
                            id: string;
                            title: string;
                        } | undefined;
                        list_reply?: {
                            id: string;
                            title: string;
                        } | undefined;
                    }, {
                        type: string;
                        button_reply?: {
                            id: string;
                            title: string;
                        } | undefined;
                        list_reply?: {
                            id: string;
                            title: string;
                        } | undefined;
                    }>>;
                }, "strip", z.ZodTypeAny, {
                    timestamp: string;
                    id: string;
                    type: string;
                    from: string;
                    text?: {
                        body: string;
                    } | undefined;
                    image?: {
                        id: string;
                        mime_type: string;
                    } | undefined;
                    interactive?: {
                        type: string;
                        button_reply?: {
                            id: string;
                            title: string;
                        } | undefined;
                        list_reply?: {
                            id: string;
                            title: string;
                        } | undefined;
                    } | undefined;
                }, {
                    timestamp: string;
                    id: string;
                    type: string;
                    from: string;
                    text?: {
                        body: string;
                    } | undefined;
                    image?: {
                        id: string;
                        mime_type: string;
                    } | undefined;
                    interactive?: {
                        type: string;
                        button_reply?: {
                            id: string;
                            title: string;
                        } | undefined;
                        list_reply?: {
                            id: string;
                            title: string;
                        } | undefined;
                    } | undefined;
                }>, "many">>;
            }, "strip", z.ZodTypeAny, {
                messaging_product: string;
                metadata: {
                    display_phone_number: string;
                    phone_number_id: string;
                };
                messages?: {
                    timestamp: string;
                    id: string;
                    type: string;
                    from: string;
                    text?: {
                        body: string;
                    } | undefined;
                    image?: {
                        id: string;
                        mime_type: string;
                    } | undefined;
                    interactive?: {
                        type: string;
                        button_reply?: {
                            id: string;
                            title: string;
                        } | undefined;
                        list_reply?: {
                            id: string;
                            title: string;
                        } | undefined;
                    } | undefined;
                }[] | undefined;
            }, {
                messaging_product: string;
                metadata: {
                    display_phone_number: string;
                    phone_number_id: string;
                };
                messages?: {
                    timestamp: string;
                    id: string;
                    type: string;
                    from: string;
                    text?: {
                        body: string;
                    } | undefined;
                    image?: {
                        id: string;
                        mime_type: string;
                    } | undefined;
                    interactive?: {
                        type: string;
                        button_reply?: {
                            id: string;
                            title: string;
                        } | undefined;
                        list_reply?: {
                            id: string;
                            title: string;
                        } | undefined;
                    } | undefined;
                }[] | undefined;
            }>;
            field: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            field: string;
            value: {
                messaging_product: string;
                metadata: {
                    display_phone_number: string;
                    phone_number_id: string;
                };
                messages?: {
                    timestamp: string;
                    id: string;
                    type: string;
                    from: string;
                    text?: {
                        body: string;
                    } | undefined;
                    image?: {
                        id: string;
                        mime_type: string;
                    } | undefined;
                    interactive?: {
                        type: string;
                        button_reply?: {
                            id: string;
                            title: string;
                        } | undefined;
                        list_reply?: {
                            id: string;
                            title: string;
                        } | undefined;
                    } | undefined;
                }[] | undefined;
            };
        }, {
            field: string;
            value: {
                messaging_product: string;
                metadata: {
                    display_phone_number: string;
                    phone_number_id: string;
                };
                messages?: {
                    timestamp: string;
                    id: string;
                    type: string;
                    from: string;
                    text?: {
                        body: string;
                    } | undefined;
                    image?: {
                        id: string;
                        mime_type: string;
                    } | undefined;
                    interactive?: {
                        type: string;
                        button_reply?: {
                            id: string;
                            title: string;
                        } | undefined;
                        list_reply?: {
                            id: string;
                            title: string;
                        } | undefined;
                    } | undefined;
                }[] | undefined;
            };
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        id: string;
        changes: {
            field: string;
            value: {
                messaging_product: string;
                metadata: {
                    display_phone_number: string;
                    phone_number_id: string;
                };
                messages?: {
                    timestamp: string;
                    id: string;
                    type: string;
                    from: string;
                    text?: {
                        body: string;
                    } | undefined;
                    image?: {
                        id: string;
                        mime_type: string;
                    } | undefined;
                    interactive?: {
                        type: string;
                        button_reply?: {
                            id: string;
                            title: string;
                        } | undefined;
                        list_reply?: {
                            id: string;
                            title: string;
                        } | undefined;
                    } | undefined;
                }[] | undefined;
            };
        }[];
    }, {
        id: string;
        changes: {
            field: string;
            value: {
                messaging_product: string;
                metadata: {
                    display_phone_number: string;
                    phone_number_id: string;
                };
                messages?: {
                    timestamp: string;
                    id: string;
                    type: string;
                    from: string;
                    text?: {
                        body: string;
                    } | undefined;
                    image?: {
                        id: string;
                        mime_type: string;
                    } | undefined;
                    interactive?: {
                        type: string;
                        button_reply?: {
                            id: string;
                            title: string;
                        } | undefined;
                        list_reply?: {
                            id: string;
                            title: string;
                        } | undefined;
                    } | undefined;
                }[] | undefined;
            };
        }[];
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    object: string;
    entry: {
        id: string;
        changes: {
            field: string;
            value: {
                messaging_product: string;
                metadata: {
                    display_phone_number: string;
                    phone_number_id: string;
                };
                messages?: {
                    timestamp: string;
                    id: string;
                    type: string;
                    from: string;
                    text?: {
                        body: string;
                    } | undefined;
                    image?: {
                        id: string;
                        mime_type: string;
                    } | undefined;
                    interactive?: {
                        type: string;
                        button_reply?: {
                            id: string;
                            title: string;
                        } | undefined;
                        list_reply?: {
                            id: string;
                            title: string;
                        } | undefined;
                    } | undefined;
                }[] | undefined;
            };
        }[];
    }[];
}, {
    object: string;
    entry: {
        id: string;
        changes: {
            field: string;
            value: {
                messaging_product: string;
                metadata: {
                    display_phone_number: string;
                    phone_number_id: string;
                };
                messages?: {
                    timestamp: string;
                    id: string;
                    type: string;
                    from: string;
                    text?: {
                        body: string;
                    } | undefined;
                    image?: {
                        id: string;
                        mime_type: string;
                    } | undefined;
                    interactive?: {
                        type: string;
                        button_reply?: {
                            id: string;
                            title: string;
                        } | undefined;
                        list_reply?: {
                            id: string;
                            title: string;
                        } | undefined;
                    } | undefined;
                }[] | undefined;
            };
        }[];
    }[];
}>;
export type WhatsAppWebhook = z.infer<typeof WhatsAppWebhookSchema>;
//# sourceMappingURL=feedback.d.ts.map