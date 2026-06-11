import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { logger } from "../utils/logger";

type ValidateTarget = "body" | "query" | "params";

/**
 * Middleware factory: validates the request using a Zod schema.
 * Replaces the target (body/query/params) with the parsed+coerced value.
 */
export const validate =
  <T>(schema: ZodSchema<T>, target: ValidateTarget = "body") =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const issues = (result.error as ZodError).issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      logger.warn(
        `Validation failed for ${target} on ${req.method} ${req.path}: ${JSON.stringify(
          issues
        )}`
      );

      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: issues,
        },
      });
      return;
    }

    // Replace with parsed (and coerced) values
    (req as any)[target] = result.data;
    next();
  };
