// ============================================================
// Admin / User Types
// Ayesha Ali Academy Feedback Management System
// ============================================================

/**
 * Admin role — determines what data they can access.
 */
export enum AdminRole {
  /** Full access including identity for all feedback types. */
  PRINCIPAL = "principal",
  /** Standard admin — cannot see identity for PRINCIPAL_ONLY feedback. */
  ADMIN = "admin",
}

export interface Admin {
  id: string; // UUID — matches Supabase auth.users id
  name: string;
  email: string;
  role: AdminRole;
  created_at: string; // ISO 8601
}

export interface AdminSession {
  admin: Admin;
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp
}
