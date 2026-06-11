import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { MessagingService, MessageReceivedData, SendMessageOptions } from "./types";
import { logger } from "../../utils/logger";

export class WhatsAppWebService implements MessagingService {
  private client: Client;
  private messageHandler: ((message: MessageReceivedData) => Promise<void>) | null = null;

  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: ".wwebjs_auth",
      }),
      authTimeoutMs: 300000, // 5 minutes
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
        protocolTimeout: 300000, // 5 minutes
      },
    });
  }

  async initialize(): Promise<void> {
    this.client.on("qr", (qr) => {
      logger.info("WhatsApp QR Code received. Please scan the QR code printed below to authenticate:");
      qrcode.generate(qr, { small: true });
    });

    this.client.on("ready", () => {
      logger.info("✅ WhatsApp client is ready and listening!");
    });

    this.client.on("authenticated", () => {
      logger.info("WhatsApp authentication successful.");
    });

    this.client.on("auth_failure", (msg) => {
      logger.error(`WhatsApp authentication failure: ${msg}`);
    });

    this.client.on("message", async (msg) => {
      // Ignore group chats and messages from status updates
      if (msg.from.endsWith("@g.us") || msg.from === "status@broadcast") {
        return;
      }

      if (this.messageHandler) {
        try {
          const from = msg.from;
          const body = msg.body;
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
            from,
            body,
            hasMedia,
            downloadMedia,
          });
        } catch (error) {
          logger.error("Error processing incoming WhatsApp message:", error);
        }
      }
    });

    await this.client.initialize();
  }

  async sendMessage(to: string, text: string, _options?: SendMessageOptions): Promise<void> {
    try {
      // If it already has a domain suffix (like @c.us or @lid), send to it directly
      const formattedTo = to.includes("@") ? to : `${to}@c.us`;
      logger.debug(`Sending WhatsApp message to: ${formattedTo}`);
      await this.client.sendMessage(formattedTo, text);
    } catch (error) {
      logger.error(`Failed to send WhatsApp message to ${to}:`, error);
      throw error;
    }
  }

  onMessageReceived(handler: (message: MessageReceivedData) => Promise<void>): void {
    this.messageHandler = handler;
  }
}
export const messagingService = new WhatsAppWebService();
