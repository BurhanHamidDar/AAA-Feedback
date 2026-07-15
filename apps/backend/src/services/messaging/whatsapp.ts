import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { MessagingService, MessageReceivedData, SendMessageOptions } from "./types";
import { logger } from "../../utils/logger";

// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp Web Service
//
// Architecture notes:
//  • Singleton guard: initialize() is idempotent. Calling it a second time
//    while a client is already running logs a warning and returns immediately.
//    This prevents duplicate Puppeteer injections and the
//    "window['onQRChangedEvent'] already exists" error.
//
//  • Lazy client creation: new Client() is called inside initialize(), not in
//    the constructor. The module-level export is just an empty service object
//    until initialize() is explicitly called from index.ts.
//
//  • Disconnected handler: when WhatsApp drops the session (network flap,
//    phone logout, server wake), the broken client is destroyed and a fresh
//    one is reconnected automatically after a short delay — without needing
//    a PM2 restart.
//
//  • @lid resolution: WhatsApp multi-device (linked-device) mode sends
//    messages using an opaque Linked-Device ID instead of a real phone number.
//    We resolve the real number via msg.getContact() before passing it to the
//    bot so the database lookup works correctly.
// ─────────────────────────────────────────────────────────────────────────────

const RECONNECT_DELAY_MS = 30_000; // 30 seconds between reconnect attempts

export class WhatsAppWebService implements MessagingService {
  private client: Client | null = null;
  private messageHandler: ((message: MessageReceivedData) => Promise<void>) | null = null;
  private isInitialized = false;
  private initCount = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  // ─── Public API ───────────────────────────────────────────────────────────

  async initialize(): Promise<void> {
    // Singleton guard — never create a second client while one is running
    if (this.isInitialized) {
      logger.warn("[WA] Initialization guard: client is already running — skipping duplicate call.");
      return;
    }

    this.isInitialized = true;
    this.initCount += 1;
    logger.info(`[WA] Creating new WhatsApp Client (attempt #${this.initCount})...`);

    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: ".wwebjs_auth",
      }),
      authTimeoutMs: 300_000,   // 5 minutes
      qrMaxRetries: 10,
      puppeteer: {
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
        ],
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        protocolTimeout: 300_000, // 5 minutes
      },
    });

    logger.info("[WA] Registering event listeners...");
    this._registerEvents();

    logger.info("[WA] Initializing client (launching Puppeteer)...");
    await this.client.initialize();
  }

  async sendMessage(to: string, text: string, _options?: SendMessageOptions): Promise<void> {
    if (!this.client) {
      logger.error("[WA] sendMessage called but client is not initialized.");
      throw new Error("WhatsApp client is not initialized.");
    }
    try {
      // Accept both bare numbers and fully-qualified JIDs (@c.us / @lid)
      const formattedTo = to.includes("@") ? to : `${to}@c.us`;
      logger.info(`[WA] Sending message to: ${formattedTo}`);
      await this.client.sendMessage(formattedTo, text);
    } catch (error) {
      logger.error(`[WA] Failed to send message to ${to}:`, error);
      throw error;
    }
  }

  onMessageReceived(handler: (message: MessageReceivedData) => Promise<void>): void {
    // Store handler in memory; it survives reconnects without needing re-registration
    this.messageHandler = handler;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  /**
   * Register all Puppeteer / WhatsApp event listeners exactly once on the
   * current client instance. Called only from initialize().
   */
  private _registerEvents(): void {
    if (!this.client) return;

    // ── QR code ──
    this.client.on("qr", (qr) => {
      logger.info("[WA] QR code generated — please scan to authenticate:");
      qrcode.generate(qr, { small: true });
    });

    // ── Authentication ──
    this.client.on("authenticated", () => {
      logger.info("[WA] Authenticated successfully.");
    });

    this.client.on("auth_failure", (msg) => {
      logger.error(`[WA] Authentication failure: ${msg}`);
      // Auth failure means the session is broken; trigger reconnect
      this._scheduleReconnect("auth_failure");
    });

    // ── Ready ──
    this.client.on("ready", () => {
      logger.info("[WA] Client is ready and listening for messages!");
    });

    // ── Disconnected (the critical missing handler) ──
    this.client.on("disconnected", (reason) => {
      logger.warn(`[WA] Client disconnected. Reason: ${reason}`);
      this._scheduleReconnect(reason);
    });

    // ── Inbound messages ──
    this.client.on("message", async (msg) => {
      // Ignore group chats and broadcast status
      if (msg.from.endsWith("@g.us") || msg.from === "status@broadcast") {
        return;
      }

      logger.info(`[WA] Raw message from ${msg.from}: "${msg.body}"`);

      if (!this.messageHandler) return;

      try {
        // ── Two concerns must be handled separately ──────────────────────────
        //
        // 1. REPLY ADDRESS ("from"): always the ORIGINAL msg.from JID.
        //    WhatsApp's internal routing can deliver to both @c.us and @lid
        //    addresses. Converting a @lid to @c.us breaks routing because
        //    "236622683627630" is not a real phone number — it is an opaque
        //    Linked-Device ID. Sending to a fabricated "@c.us" produces the
        //    error: "No LID for user".
        //
        // 2. PHONE NUMBER ("phoneNumber"): the real digits-only phone number
        //    used for session keys and database lookups.
        //    For @c.us senders: extracted directly from the JID (reliable).
        //    For @lid senders: obtained from getContact(). We validate the
        //    result by checking contact.id.server — if it is still "lid", the
        //    contact record does not expose the real phone number, so we fall
        //    back to the LID user-part (parent lookup will fall through to the
        //    unregistered flow, which is safe and correct behaviour).
        // ────────────────────────────────────────────────────────────────────

        const from = msg.from; // Always the original JID — used only for replying
        let phoneNumber = msg.from.split("@")[0]; // Fallback: JID user-part

        if (msg.from.endsWith("@lid")) {
          try {
            const contact = await msg.getContact();

            // contact.id.server === 'c.us' means getContact() successfully resolved
            // the @lid to a real phone-number-based contact. In that case,
            // contact.number is the genuine phone number (e.g. "919876543210").
            //
            // If contact.id.server is still 'lid', the real phone is not exposed
            // by the WhatsApp Web API for this contact. We keep the LID user-part
            // as the session key — the bot degrades gracefully to the unregistered
            // menu; the user can still submit feedback via admission-number flow.
            if (contact.id && (contact.id as any).server === "c.us" && contact.number) {
              phoneNumber = contact.number;
              logger.info(`[WA] @lid resolved to real phone via contact: ${phoneNumber}`);
            } else if (contact.number && (contact.id as any).server !== "lid") {
              phoneNumber = contact.number;
              logger.info(`[WA] @lid resolved to phone: ${phoneNumber}`);
            } else {
              logger.warn(
                `[WA] @lid sender ${msg.from} — real phone not available from contact ` +
                `(contact.id.server="${(contact.id as any)?.server}", contact.number="${contact.number}"). ` +
                `Using LID user-part as session key; parent lookup will fall through to unregistered flow.`
              );
            }
          } catch (lidErr) {
            logger.error(`[WA] getContact() failed for @lid ${msg.from} — using LID user-part as fallback:`, lidErr);
          }
        }

        const hasMedia = msg.hasMedia;
        const downloadMedia = hasMedia
          ? async () => {
              const media = await msg.downloadMedia();
              return {
                mimetype: media.mimetype,
                data: media.data,
                filename: media.filename || undefined,
              };
            }
          : undefined;

        await this.messageHandler({
          from,         // Original JID → used by bot for replying
          phoneNumber,  // Real phone (or LID fallback) → used by bot for DB/session
          body: msg.body,
          hasMedia,
          downloadMedia,
        });
      } catch (error) {
        logger.error("[WA] Error processing inbound message:", error);
      }
    });
  }

  /**
   * Destroy the broken client and schedule a fresh reconnect after a delay.
   * Clears any pending reconnect timer before scheduling to avoid stacking.
   */
  private _scheduleReconnect(reason: string): void {
    // Clear any existing pending reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Destroy the current broken client
    this._destroyClient();

    logger.info(`[WA] Reconnecting in ${RECONNECT_DELAY_MS / 1000}s (reason: ${reason})...`);

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      logger.info("[WA] Attempting reconnect now...");
      try {
        await this.initialize();
        logger.info("[WA] Reconnect successful.");
      } catch (err) {
        logger.error("[WA] Reconnect attempt failed:", err);
        // If reconnect itself fails, schedule another attempt
        this._scheduleReconnect("reconnect_failed");
      }
    }, RECONNECT_DELAY_MS);
  }

  /**
   * Destroy the current Puppeteer client cleanly, reset all state flags,
   * and remove all listeners to prevent memory leaks.
   */
  private _destroyClient(): void {
    if (this.client) {
      try {
        logger.info("[WA] Destroying broken client...");
        this.client.removeAllListeners();
        // destroy() closes the Puppeteer browser — fire-and-forget intentionally
        this.client.destroy().catch((err) => {
          logger.warn("[WA] Client.destroy() error (non-fatal):", err);
        });
      } catch (err) {
        logger.warn("[WA] Error while destroying client (non-fatal):", err);
      }
      this.client = null;
    }
    // Reset the guard so initialize() can run again cleanly
    this.isInitialized = false;
  }
}

// Module-level singleton — a single shared instance for the entire process.
// WhatsApp Web.js must never run more than one Client per Puppeteer session.
export const messagingService = new WhatsAppWebService();
