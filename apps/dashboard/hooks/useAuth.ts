"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api";

interface Admin {
  id: string;
  name: string;
  email: string;
  role: "principal" | "admin";
}

interface AuthState {
  admin: Admin | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    admin: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    const stored = localStorage.getItem("aaa_admin");
    const token = localStorage.getItem("aaa_access_token");

    if (stored && token) {
      try {
        const admin = JSON.parse(stored) as Admin;
        setState({ admin, isLoading: false, isAuthenticated: true });
      } catch {
        setState({ admin: null, isLoading: false, isAuthenticated: false });
      }
    } else {
      setState({ admin: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      const response = await apiClient.post("/auth/login", { email, password });
      const { data } = response.data;

      localStorage.setItem("aaa_access_token", data.access_token);
      localStorage.setItem("aaa_admin", JSON.stringify(data.admin));

      setState({
        admin: data.admin as Admin,
        isLoading: false,
        isAuthenticated: true,
      });
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      localStorage.removeItem("aaa_access_token");
      localStorage.removeItem("aaa_admin");
      setState({ admin: null, isLoading: false, isAuthenticated: false });
      window.location.href = "/login";
    }
  }, []);

  return { ...state, login, logout };
}
