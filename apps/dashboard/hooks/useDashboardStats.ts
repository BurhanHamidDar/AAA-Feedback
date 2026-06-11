import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import type { DashboardStats, MonthlyTrendPoint, CategoryBreakdown } from "@aaa-feedback/shared";

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard", "overview"],
    queryFn: async () => {
      const res = await apiClient.get("/reports/overview");
      return res.data.data as DashboardStats;
    },
    refetchInterval: 60_000, // refresh every minute
  });
}

export function useFeedbackTrends() {
  return useQuery<MonthlyTrendPoint[]>({
    queryKey: ["dashboard", "trends"],
    queryFn: async () => {
      const res = await apiClient.get("/reports/trends");
      return res.data.data as MonthlyTrendPoint[];
    },
  });
}

export function useCategoryBreakdown() {
  return useQuery<CategoryBreakdown[]>({
    queryKey: ["dashboard", "categories"],
    queryFn: async () => {
      const res = await apiClient.get("/reports/categories");
      return res.data.data as CategoryBreakdown[];
    },
  });
}

export function useAnalytics(params: {
  date_from?: string;
  date_to?: string;
  category?: string;
  sentiment?: string;
  priority?: string;
  status?: string;
  submission_type?: string;
  class?: string;
  section?: string;
}) {
  return useQuery<any>({
    queryKey: ["dashboard", "analytics", params],
    queryFn: async () => {
      const cleanedParams = Object.entries(params).reduce((acc, [key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          acc[key] = String(val);
        }
        return acc as Record<string, string>;
      }, {} as Record<string, string>);

      const res = await apiClient.get("/reports/analytics", { params: cleanedParams });
      return res.data.data;
    },
  });
}

