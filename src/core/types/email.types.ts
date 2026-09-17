export type EmailPriority = 'high' | 'normal' | 'low';

export type EmailStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SENT'
  | 'FAILED'
  | 'THROTTLED'
  | 'FALLBACK'
  | 'DELIVERED'
  | 'BOUNCED'
  | 'SUPPRESSED';

export interface EmailAttachment {
  filename: string;
  content: string; // Base64 or UTF-8 string
  contentType?: string;
  disposition?: 'attachment' | 'inline';
  cid?: string;
}

export interface EmailMessage {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  from?: string;
  replyTo?: string;
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  templateCode?: string;
  templateData?: Record<string, any>;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  priority?: EmailPriority;
  scheduledAt?: Date | string;
  saveToSentItems?: boolean;
  async?: boolean;
  tenantId?: string;
}
