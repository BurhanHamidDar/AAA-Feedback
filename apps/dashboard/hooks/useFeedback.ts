import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import type { FeedbackStatus, FeedbackType, FeedbackSubmitterType, FeedbackScope } from "@aaa-feedback/shared";

interface StudentItem {
  id: string;
  admission_no: string;
  student_name: string;
  class: string;
  section: string;
}

export interface FeedbackItem {
  id: string;
  tracking_number: string | null;
  submission_type: FeedbackType;
  submitter_type: FeedbackSubmitterType;
  raw_text: string;
  summary: string | null;
  category: any | null;
  sentiment: any | null;
  priority: any | null;
  ai_processed: boolean;
  ai_processed_at: string | null;
  status: FeedbackStatus;
  submitter_name: string | null;
  submitter_phone: string | null;
  is_anonymous: boolean;
  feedback_scope?: FeedbackScope;
  submitter_relationship?: string | null;
  student?: StudentItem | null;
  created_at: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

interface FeedbackListResponse {
  success: boolean;
  data: FeedbackItem[];
  pagination: PaginationInfo;
}

interface FeedbackDetailResponse {
  success: boolean;
  data: any; // full feedback detail object
}

export function useFeedbackList(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  category?: string;
  priority?: string;
  sentiment?: string;
  submission_type?: string;
  submitter_type?: string;
}) {
  return useQuery<FeedbackListResponse>({
    queryKey: ["feedback", "list", params],
    queryFn: async () => {
      // Clean undefined and empty strings
      const cleanedParams = Object.entries(params).reduce((acc, [key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          acc[key] = String(val);
        }
        return acc as Record<string, string>;
      }, {} as Record<string, string>);

      const res = await apiClient.get("/feedback", { params: cleanedParams });
      return res.data as FeedbackListResponse;
    },
  });
}

export function useFeedbackDetail(id: string) {
  return useQuery<FeedbackDetailResponse>({
    queryKey: ["feedback", "detail", id],
    queryFn: async () => {
      const res = await apiClient.get(`/feedback/${id}`);
      return res.data as FeedbackDetailResponse;
    },
    enabled: !!id,
  });
}

export function useUpdateFeedbackStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, last_action_note }: { id: string; status: FeedbackStatus; last_action_note?: string }) => {
      const res = await apiClient.patch(`/feedback/${id}/status`, { status, last_action_note });
      return res.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["feedback", "list"] });
      queryClient.invalidateQueries({ queryKey: ["feedback", "detail", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "analytics"] });
    },
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      feedbackId,
      commentText,
    }: {
      feedbackId: string;
      commentText: string;
    }) => {
      const res = await apiClient.post(`/feedback/${feedbackId}/comments`, {
        comment_text: commentText,
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["feedback", "detail", variables.feedbackId] });
    },
  });
}

export function useReprocessFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/feedback/${id}/reprocess`);
      return res.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["feedback", "list"] });
      queryClient.invalidateQueries({ queryKey: ["feedback", "detail", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] });
    },
  });
}
