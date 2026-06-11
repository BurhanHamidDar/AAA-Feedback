import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { logger } from "./utils/logger";
import { apiRateLimit } from "./middleware/rateLimit";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { xssSanitizer } from "./middleware/xss";

// Route imports
import authRouter from "./routes/auth";
import feedbackRouter from "./routes/feedback";
import commentsRouter from "./routes/comments";
import uploadsRouter from "./routes/uploads";
import reportsRouter from "./routes/reports";
import clustersRouter from "./routes/clusters";
import webhookRouter from "./routes/webhook";
import verificationRouter from "./routes/verification";
import trackingRouter from "./routes/tracking";
import settingsRouter from "./routes/settings";
import { messagingService } from "./services/messaging/whatsapp";
import { initializeFeedbackBot } from "./services/bot/feedbackBot";
import { detectSchemaExtensions } from "./utils/schema";

// ──────────────────────────────────────────────

// Bootstrap
// ──────────────────────────────────────────────

const app: express.Application = express();
app.disable("x-powered-by"); // Hide Express footprint
const PORT = parseInt(process.env.PORT ?? "4000", 10);

// ──────────────────────────────────────────────
// Global Middleware
// ──────────────────────────────────────────────

// Security headers
app.use(helmet());

// CORS
const allowedOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., Postman, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin '${origin}' not allowed`));
      }
    },
    credentials: true,
  })
);

// Request logging
app.use(
  morgan("dev", {
    stream: { write: (msg) => logger.http(msg.trim()) },
  })
);

// Body parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Sanitize inputs for XSS protection
app.use(xssSanitizer);

// Global rate limiting (per IP)
app.use("/api", apiRateLimit);

// ──────────────────────────────────────────────
// Health Check (unauthenticated)
// ──────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "AAA Feedback API",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  });
});

// ──────────────────────────────────────────────
// API Routes
// ──────────────────────────────────────────────

app.use("/api/auth", authRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/feedback/:feedbackId/comments", commentsRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/clusters", clustersRouter);
app.use("/webhook", webhookRouter);
app.use("/api/verification", verificationRouter);
app.use("/api/tracking", trackingRouter);
app.use("/api/settings", settingsRouter);


// ──────────────────────────────────────────────
// Error Handling (must be last)
// ──────────────────────────────────────────────

app.use(notFoundHandler);
app.use(errorHandler);

// ──────────────────────────────────────────────
// Start Server
// ──────────────────────────────────────────────

app.listen(PORT, () => {
  logger.info(`✅ AAA Feedback API running on http://localhost:${PORT}`);
  logger.info(`   Environment: ${process.env.NODE_ENV ?? "development"}`);
  logger.info(`   Health check: http://localhost:${PORT}/health`);

  // Detect schema columns dynamically
  detectSchemaExtensions().catch((err) => {
    logger.error("Failed to execute schema detection on boot:", err);
  });

  // Initialize WhatsApp Bot services
  messagingService
    .initialize()
    .then(() => {
      initializeFeedbackBot();
      logger.info("🤖 WhatsApp Feedback Bot fully initialized!");
    })
    .catch((err) => {
      const errMsg = err instanceof Error ? err.stack || err.message : String(err);
      logger.error(`❌ Failed to initialize WhatsApp service: ${errMsg}`);
      logger.error("Exiting process in 5 seconds to trigger PM2 restart...");
      setTimeout(() => {
        process.exit(1);
      }, 5000);
    });
});

export default app;
