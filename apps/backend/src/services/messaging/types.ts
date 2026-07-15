export interface SendMessageOptions {
  mediaUrl?: string;
  mimetype?: string;
  filename?: string;
}

export interface MessageReceivedData {
  /**
   * The full WhatsApp JID of the sender — used exclusively for SENDING replies.
   * May be a standard number address (e.g., "919876543210@c.us") or a
   * Linked-Device ID (e.g., "236622683627630@lid") in multi-device mode.
   * Never use this for database lookups or session keys.
   */
  from: string;

  /**
   * The real phone number (digits only, no "@" suffix) — used for session keys
   * and database lookups (e.g., "919876543210").
   * For @c.us senders this is extracted directly from the JID.
   * For @lid senders this is resolved via getContact(); falls back to the LID
   * user-part if the contact's server is still "lid" (real number unavailable).
   */
  phoneNumber: string;

  body: string;
  hasMedia: boolean;
  downloadMedia?: () => Promise<{ mimetype: string; data: string; filename?: string }>;
}

export interface MessagingService {
  initialize(): Promise<void>;
  sendMessage(to: string, text: string, options?: SendMessageOptions): Promise<void>;
  onMessageReceived(handler: (message: MessageReceivedData) => Promise<void>): void;
}
