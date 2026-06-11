import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Global Express error handler.
 * Must be registered LAST in the Express middleware chain.
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode ?? 500;
  const isDev = process.env.NODE_ENV !== "production";

  logger.error(`${req.method} ${req.path} — ${err.message}`, {
    statusCode,
    stack: isDev ? err.stack : undefined,
  });

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code ?? "INTERNAL_SERVER_ERROR",
      message:
        statusCode === 500 && !isDev
          ? "An unexpected error occurred"
          : err.message,
      ...(isDev && { stack: err.stack }),
    },
  });
};

/**
 * 404 handler — catches any request that didn't match a route.
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route not found: ${req.method} ${req.path}`,
    },
  });
};
