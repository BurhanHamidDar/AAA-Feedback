import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "../config/supabase";
import { validate } from "../middleware/validate";
import { authRateLimit } from "../middleware/rateLimit";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { LoginSchema } from "@aaa-feedback/shared";
import { logger } from "../utils/logger";

const router: Router = Router();

/**
 * POST /auth/login
 * Authenticates an admin with email + password via Supabase Auth.
 */
router.post(
  "/login",
  authRateLimit,
  validate(LoginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };

    const authClient = createClient(
      process.env.SUPABASE_URL ?? "",
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const { data, error } = await authClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      res.status(401).json({
        success: false,
        error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
      });
      return;
    }

    // Fetch admin profile
    const { data: adminData, error: adminError } = await supabase
      .from("admins")
      .select("id, name, role")
      .eq("id", data.user.id)
      .single();

    if (adminError || !adminData) {
      logger.warn(`Login: User ${data.user.id} has no admin profile`);
      res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Access denied — not an admin" },
      });
      return;
    }

    logger.info(`Admin login: ${email} (role: ${adminData.role})`);

    res.json({
      success: true,
      data: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        admin: {
          id: adminData.id,
          name: adminData.name,
          email: data.user.email,
          role: adminData.role,
        },
      },
    });
  })
);

/**
 * POST /auth/logout
 * Invalidates the current session.
 */
router.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req, res) => {
    const authedReq = req as AuthenticatedRequest;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const authClient = createClient(
        process.env.SUPABASE_URL ?? "",
        process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      );
      await authClient.auth.setSession({
        access_token: token,
        refresh_token: "",
      });
      await authClient.auth.signOut();
    }
    logger.info(`Admin logout: ${authedReq.adminEmail}`);
    res.json({ success: true, data: { message: "Logged out successfully" } });
  })
);

/**
 * GET /auth/me
 * Returns the current admin's profile.
 */
router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const authedReq = req as AuthenticatedRequest;

    const { data, error } = await supabase
      .from("admins")
      .select("id, name, role, created_at")
      .eq("id", authedReq.adminId)
      .single();

    if (error || !data) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Admin profile not found" },
      });
      return;
    }

    res.json({
      success: true,
      data: { ...data, email: authedReq.adminEmail },
    });
  })
);

/**
 * POST /auth/change-password
 * Changes the authenticated admin's password.
 */
router.post(
  "/change-password",
  requireAuth,
  asyncHandler(async (req, res) => {
    const authedReq = req as AuthenticatedRequest;
    const { password } = req.body as { password?: string };

    if (!password || typeof password !== "string" || password.length < 6) {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_INPUT", message: "Password must be at least 6 characters long" },
      });
      return;
    }

    const authClient = createClient(
      process.env.SUPABASE_URL ?? "",
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    // Update user password via supabase admin API
    const { error } = await authClient.auth.admin.updateUserById(authedReq.adminId, {
      password: password,
    });

    if (error) {
      logger.error(`Failed to update password for user ${authedReq.adminId}:`, error);
      res.status(500).json({
        success: false,
        error: { code: "AUTH_ERROR", message: error.message },
      });
      return;
    }

    logger.info(`Password successfully updated for admin ${authedReq.adminEmail}`);

    res.json({
      success: true,
      message: "Password changed successfully.",
    });
  })
);

export default router;
