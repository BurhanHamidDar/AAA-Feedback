import { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { logger } from "../utils/logger";

// Lightweight anon client for JWT verification only
const supabaseAnon = createClient(
  process.env.SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
);

export interface AuthenticatedRequest extends Request {
  adminId: string;
  adminRole: string;
  adminEmail: string;
}

/**
 * Middleware: verifies the Bearer JWT from Supabase Auth.
 * Attaches adminId, adminRole, adminEmail to the request.
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Missing or invalid authorization header" },
    });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const { data, error } = await supabaseAnon.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({
        success: false,
        error: { code: "INVALID_TOKEN", message: "Token is invalid or expired" },
      });
      return;
    }

    // Fetch admin profile to get role
    const { data: adminData, error: adminError } = await supabaseAnon
      .from("admins")
      .select("id, role")
      .eq("id", data.user.id)
      .single();

    if (adminError || !adminData) {
      logger.warn(`Auth: User ${data.user.id} has no admin profile`);
      res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Access denied" },
      });
      return;
    }

    const authedReq = req as AuthenticatedRequest;
    authedReq.adminId = data.user.id;
    authedReq.adminRole = adminData.role as string;
    authedReq.adminEmail = data.user.email ?? "";

    next();
  } catch (err) {
    logger.error("Auth middleware error:", err);
    res.status(500).json({
      success: false,
      error: { code: "AUTH_ERROR", message: "Authentication service error" },
    });
  }
};

/**
 * Middleware: requires the principal role specifically.
 * Must be used after requireAuth.
 */
export const requirePrincipal = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authedReq = req as AuthenticatedRequest;

  if (authedReq.adminRole !== "principal") {
    res.status(403).json({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "This action requires principal access",
      },
    });
    return;
  }

  next();
};
