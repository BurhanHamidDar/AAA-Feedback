export interface SendMessageOptions {
  mediaUrl?: string;
  mimetype?: string;
  filename?: string;
}

export interface MessageReceivedData {
  from: string; // Sender's format (e.g., "919876543210@c.us")
  body: string;
  hasMedia: boolean;
  downloadMedia?: () => Promise<{ mimetype: string; data: string; filename?: string }>;
}

export interface MessagingService {
  initialize(): Promise<void>;
  sendMessage(to: string, text: string, options?: SendMessageOptions): Promise<void>;
  onMessageReceived(handler: (message: MessageReceivedData) => Promise<void>): void;
}
