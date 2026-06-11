import rateLimit from "express-rate-limit";
import { logger } from "../utils/logger";

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "900000", 10); // 15 min
const max = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? "100", 10);

export const apiRateLimit = rateLimit({
  windowMs,
  max,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many requests. Please try again later.",
    },
  },
  handler: (req, res, _next, options) => {
    logger.warn(`Rate limit hit: ${req.ip} → ${req.path}`);
    res.status(options.statusCode).json(options.message);
  },
});

/** Stricter limit for auth endpoints */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many login attempts. Please wait 15 minutes.",
    },
  },
});

/** Very strict limit for webhook (Meta retries aggressively) */
export const webhookRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

/** Very strict limit for student verification checks to prevent brute force */
export const verificationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 15, // max 15 attempts per IP per 15 minutes
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many verification attempts. Please wait 15 minutes.",
    },
  },
});
