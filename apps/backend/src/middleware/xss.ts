import { Request, Response, NextFunction } from "express";

/**
 * Recursively strips HTML tags from input string or object values.
 */
function sanitize(val: any): any {
  if (typeof val === "string") {
    // Strip HTML tag structures to protect against persistent XSS
    return val.replace(/<[^>]*>/g, "");
  }
  if (Array.isArray(val)) {
    return val.map(sanitize);
  }
  if (val !== null && typeof val === "object") {
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      clean[k] = sanitize(v);
    }
    return clean;
  }
  return val;
}

/**
 * Middleware to sanitize request parameters, query string, and request body.
 */
export const xssSanitizer = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }
  next();
};
