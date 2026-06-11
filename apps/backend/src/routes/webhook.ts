import { Router, Request, Response } from "express";
import { webhookRateLimit } from "../middleware/rateLimit";
import { logger } from "../utils/logger";

const router: Router = Router();

/**
 * GET /webhook/whatsapp
 * Meta webhook verification handshake.
 * Called once by Meta when you register the webhook URL.
 */
router.get("/whatsapp", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    logger.info("WhatsApp webhook verified successfully");
    res.status(200).send(challenge as string);
  } else {
    logger.warn("WhatsApp webhook verification failed — invalid token");
    res.status(403).json({ error: "Forbidden" });
  }
});

/**
 * POST /webhook/whatsapp
 * Receives incoming WhatsApp messages from Meta Cloud API.
 * Full implementation in Phase 5.
 */
router.post(
  "/whatsapp",
  webhookRateLimit,
  (req: Request, res: Response) => {
    // Always respond 200 immediately — Meta will retry if we don't
    res.status(200).json({ status: "received" });

    // TODO (Phase 5): Process incoming message asynchronously
    logger.debug("WhatsApp webhook received:", JSON.stringify(req.body));
  }
);

export default router;
